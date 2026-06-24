import axios from 'axios';
import Order, { OrderDocument } from '../models/Order';
import { ThyrocareService } from './thyrocare';
import { thyrocareCircuitBreaker } from '../utils/circuitBreaker';
import { thyrocareRequestQueue } from '../utils/requestQueue';

// ─── User-facing display label map ────────────────────────────────────────
export const THYROCARE_DISPLAY_LABELS: Record<string, string> = {
    'YET TO ASSIGN':        'Order Booked',
    'Y':                    'Order Booked',
    'ASSIGNED':             'Technician Assigned',
    'ACCEPTED':             'Technician Accepted',
    'STARTED':              'Technician On the Way',
    'ARRIVED':              'Technician Arrived',
    'CONFIRMED':            'Sample Collected',
    'SERVICED':             'Sample at Lab',
    'PARTIAL SERVICED':     'Partially Serviced',
    'RESCHEDULED':          'Appointment Rescheduled',
    'FIX APPOINTMENT':      'Appointment Fixed',
    'DONE':                 'Report Ready',
    'REPORTED':             'Report Released',
    'CANCELLED':            'Cancelled',
    'CANCELLATIONREQUEST':  'Cancellation Requested',
    'CANCELTEST':           'Cancellation Initiated',
    'PERSUASION':           'Follow-up in Progress',
    'CALLBACK':             'Callback Requested',
    'CHARBI PUSHED':        'Assigned to Partner Technician',
    'RELEASED':             'Technician Released',
    'REQUEST TO RELEASE':   'Release Requested',
    'LAB':                  'Sample at Lab',
};

export function getDisplayLabel(thyrocareStatus: string): string {
    return THYROCARE_DISPLAY_LABELS[thyrocareStatus.toUpperCase().trim()] ?? thyrocareStatus;
}

/**
 * Service for syncing order status from Thyrocare API (pull-based fallback).
 * The primary update mechanism is the Thyrocare webhook at /api/webhooks/thyrocare.
 * This service is used for:
 *   1. Manual admin sync (single or bulk)
 *   2. Cron job fallback every 30 min
 */
export class OrderStatusSyncService {
    private static apiUrl = process.env.THYROCARE_API_URL || 'https://velso.thyrocare.cloud';

    /**
     * Fetch order summary from Thyrocare for a single order number
     */
    private static async fetchOrderStatusFromThyrocare(orderNumber: string, apiKey: string) {
        const executeApiCall = async (currentApiKey: string) => {
            console.log(`🔄 Fetching Thyrocare status for order: ${orderNumber}`);

            const response = await axios.post(
                `${this.apiUrl}/api/OrderSummary/OrderSummary`,
                {
                    OrderNo: orderNumber,
                    ApiKey:  currentApiKey,
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000,
                }
            );

            return response.data;
        };

        return await thyrocareRequestQueue.enqueue(
            async () => thyrocareCircuitBreaker.execute(() => executeApiCall(apiKey)),
            { priority: 'normal', metadata: { type: 'order_status_check', orderNumber } }
        );
    }

    /**
     * Sync status for a single order.
     * Returns { success, statusChanged, oldStatus, newStatus, message }
     */
    static async syncOrderStatus(orderIdOrDoc: string | OrderDocument) {
        try {
            const order =
                typeof orderIdOrDoc === 'string'
                    ? await Order.findById(orderIdOrDoc)
                    : orderIdOrDoc;

            if (!order) {
                throw new Error('Order not found');
            }

            if (!order.thyrocare?.orderNo) {
                return {
                    orderId:       order._id,
                    success:       false,
                    message:       'No Thyrocare order number',
                    statusChanged: false,
                };
            }

            const result = await ThyrocareService.makeRequest(async (apiKey) => {
                const thyrocareResponse = await this.fetchOrderStatusFromThyrocare(
                    order.thyrocare.orderNo as string,
                    apiKey
                );

                // Store raw response for debugging
                order.thyrocare.response = thyrocareResponse;

                // ── Capture OLD status BEFORE any mutation ──────────────
                const oldStatus = order.thyrocare.status ?? 'UNKNOWN';

                let newStatus     = oldStatus;
                let statusChanged = false;
                const reportUrls: any[] = [];

                if (thyrocareResponse.response === 'Success') {
                    // Extract raw status string
                    let rawThyrocareStatus = '';
                    if (thyrocareResponse.orderMaster?.length > 0) {
                        rawThyrocareStatus = thyrocareResponse.orderMaster[0].status ?? '';

                        // Extract report URLs from benMaster
                        const benMaster: any[] = thyrocareResponse.benMaster ?? [];
                        for (const ben of benMaster) {
                            reportUrls.push({
                                beneficiaryName: ben.name,
                                leadId:          ben.id,
                                reportUrl:       ben.url,
                            });
                        }
                    } else if (thyrocareResponse.data) {
                        rawThyrocareStatus =
                            thyrocareResponse.data.status ??
                            thyrocareResponse.data.OrderStatus ??
                            thyrocareResponse.data.currentStatus ??
                            '';
                    }

                    // ── Normalize to uppercase + trim (FIX: was done only on comparison) ──
                    const normalizedStatus = rawThyrocareStatus.toUpperCase().trim();
                    const currentNormalized = (order.thyrocare.status ?? '').toUpperCase().trim();

                    if (normalizedStatus && normalizedStatus !== currentNormalized) {
                        newStatus     = normalizedStatus;
                        statusChanged = true;

                        // Update thyrocare sub-doc
                        order.thyrocare.status = normalizedStatus;
                        order.thyrocare.statusHistory.push({
                            status:    normalizedStatus,
                            timestamp: new Date(),
                            notes:     'Synced from Thyrocare API',
                        });

                        // Map to outer Order.status
                        if (['DONE', 'REPORTED'].includes(normalizedStatus)) {
                            order.status = 'COMPLETED';
                        } else if (normalizedStatus === 'CANCELLED') {
                            order.status = 'CANCELLED';
                        } else if (order.status === 'PENDING') {
                            order.status = 'CREATED';
                        }
                    }

                    // Save available report URLs regardless of status change
                    for (const report of reportUrls) {
                        if (report.reportUrl) {
                            await (order as any).addReport(
                                report.beneficiaryName,
                                report.leadId,
                                report.reportUrl
                            );
                        }
                    }
                }

                order.thyrocare.lastSyncedAt = new Date();
                await order.save();

                return {
                    orderId:       order._id,
                    orderNumber:   order.thyrocare.orderNo,
                    success:       true,
                    statusChanged,
                    oldStatus,          // ✅ captured BEFORE mutation
                    newStatus,
                    displayLabel:  getDisplayLabel(newStatus),
                    message:       statusChanged ? `Status updated: ${oldStatus} → ${newStatus}` : 'Status unchanged',
                };
            });

            return result;
        } catch (error: any) {
            console.error('❌ Failed to sync order:', error);
            return {
                success:       false,
                message:       error.message,
                statusChanged: false,
            };
        }
    }

    /**
     * Sync all active orders that haven't been synced in the last 25 minutes.
     * Terminal statuses (COMPLETED, CANCELLED) are excluded automatically.
     */
    static async syncAllOrdersStatus() {
        const twentyFiveMinutesAgo = new Date(Date.now() - 25 * 60 * 1000);

        const orders = await Order.find({
            'thyrocare.orderNo': { $exists: true, $ne: null },
            status:              { $nin: ['COMPLETED', 'FAILED', 'CANCELLED'] },
            $or: [
                { 'thyrocare.lastSyncedAt': { $lt: twentyFiveMinutesAgo } },
                { 'thyrocare.lastSyncedAt': { $exists: false } },
            ],
        }).select('_id');

        const results: any[] = [];
        for (const order of orders) {
            results.push(await this.syncOrderStatus(order._id.toString()));
        }

        return {
            total:         orders.length,
            successful:    results.filter(r => r.success).length,
            failed:        results.filter(r => !r.success).length,
            statusChanged: results.filter(r => r.statusChanged).length,
            results,
        };
    }
}

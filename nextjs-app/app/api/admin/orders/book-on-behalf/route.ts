export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { adminOrStaffAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongoose';
import Order from '@/lib/models/Order';
import AdminActivity from '@/lib/models/AdminActivity';
import axios from 'axios';
import { ThyrocareService } from '@/lib/services/thyrocare';
import AdminSession from '@/lib/models/AdminSession';

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    const auth = await adminOrStaffAuth(req, 'users.view');

    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const isStaff         = (auth as any).role === 'staff';
    const resolvedAdminId = isStaff ? null : (auth as any).admin._id;
    const staffId         = isStaff ? (auth as any).staff._id : null;

    try {
        await connectDB();
        const body = await req.json();

        const {
            userId,
            packageIds,
            packageNames,
            packagePrices,
            beneficiaries,
            contactInfo,
            appointment,
            selectedSlot,
            reports,
            totalDiscount,
            collectionCharge,
            grandTotal
        } = body;

        // Validate required fields
        if (!userId || !packageIds || !packageNames || !packagePrices || !beneficiaries || !contactInfo || !appointment) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // ref_code must be the registered admin mobile (Thyrocare DSA requirement)
        const activeSession = await AdminSession.findOne({ isActive: true }).populate('adminId').lean();
        const thyrocareRefMobile = (activeSession as any)?.adminId?.mobile || '';

        // Calculate totals
        const totalOriginalPrice = packagePrices.reduce((sum: number, p: any) => sum + (p.thyrocareRate || p.originalPrice || p.price || 0), 0);
        const totalSellingPrice = packagePrices.reduce((sum: number, p: any) => sum + (p.sellingPrice || p.price || 0), 0);

        const calculatedDiscount = totalDiscount !== undefined && totalDiscount !== null
            ? totalDiscount
            : (totalOriginalPrice - totalSellingPrice) * beneficiaries.length;

        const totalDiscountPercentage = totalOriginalPrice > 0 ? Math.round((calculatedDiscount / (totalOriginalPrice * beneficiaries.length)) * 100) : 0;
        const combinedName = Array.isArray(packageNames) ? packageNames.join(' + ') : packageNames;

        // Create order
        const orderId = (Order as any).generateOrderId();
        const order = new Order({
            orderId,
            userId,
            adminId: resolvedAdminId,
            staffId: staffId,
            package: {
                code: packageIds,
                name: combinedName,
                price: totalSellingPrice,
                originalPrice: totalOriginalPrice,
                discountPercentage: totalDiscountPercentage,
                discountAmount: calculatedDiscount
            },
            beneficiaries: beneficiaries.map((b: any) => ({
                name: b.name,
                age: parseInt(b.age),
                gender: b.gender
            })),
            contactInfo: {
                email: (contactInfo.email && contactInfo.email.trim() !== '') ? contactInfo.email.trim() : 'no-reply@ayropath.com',
                mobile: contactInfo.mobile,
                address: contactInfo.address
            },
            appointment: {
                date: appointment.date,
                slot: selectedSlot || appointment.slot,
                slotId: appointment.slotId
            },
            reportsHardcopy: reports || 'N',
            payment: {
                amount: totalSellingPrice + (reports === 'Y' ? 75 : 0),
                type: 'POSTPAID',
                status: 'PENDING'
            },
            source: 'Ayropath (Admin)'
        });

        await order.save();

        // Create in Thyrocare
        try {
            const thyrocareResponse = await ThyrocareService.makeRequest(async (apiKey) => {
                const payload = {
                    api_key: apiKey,
                    ref_order_id: order.orderId,
                    email: order.contactInfo.email,
                    mobile: order.contactInfo.mobile,
                    address: `${order.contactInfo.address.street}, ${order.contactInfo.address.city}, ${order.contactInfo.address.state}`,
                    appt_date: `${order.appointment.date} ${order.appointment.slot.split(' - ')[0]}`,
                    order_by: (order.beneficiaries[0]?.name || 'Customer').replace(/[^a-zA-Z0-9]/g, '') || 'Customer',
                    passon: (order.package.discountAmount || 0),
                    pay_type: 'POSTPAID',
                    pincode: order.contactInfo.address.pincode,
                    products: Array.isArray(order.package.code) ? order.package.code.join(',') : order.package.code,
                    ref_code: thyrocareRefMobile,
                    reports: order.reportsHardcopy,
                    service_type: 'HOME',
                    ben_data: order.beneficiaries.map(ben => ({
                        name: ben.name,
                        age: ben.age,
                        gender: ben.gender === 'Male' ? 'M' : ben.gender === 'Female' ? 'F' : 'O'
                    })),
                    coupon: '',
                    order_mode: 'DSA-BOOKING-API',
                    collection_type: 'Home Collection',
                    source: 'Ayropath',
                    phlebo_notes: ''
                };

                const response = await axios.post(
                    'https://dx-dsa-service.thyrocare.com/api/booking-master/v2/create-order',
                    payload,
                    { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
                );

                if (response.data.response_status === 1) {
                    return response.data;
                } else {
                    console.error('[book-on-behalf] Thyrocare rejected payload:', JSON.stringify(response.data));
                    throw new Error(response.data.response || 'Thyrocare order creation failed');
                }
            }).catch(e => {
                console.error('[book-on-behalf] Thyrocare axios error:', JSON.stringify(e.response?.data || e.message));
                const thyrocareMsg = e.response?.data?.response?.message || e.response?.data?.response || e.message;
                throw new Error(typeof thyrocareMsg === 'string' ? thyrocareMsg : JSON.stringify(thyrocareMsg));
            });

            order.thyrocare.orderNo = thyrocareResponse.order_no;
            order.thyrocare.response = thyrocareResponse;

            if (thyrocareResponse.ben_data && thyrocareResponse.ben_data.length > 0) {
                thyrocareResponse.ben_data.forEach((benData: any, index: number) => {
                    if (order.beneficiaries[index]) {
                        order.beneficiaries[index].leadId = benData.lead_id;
                    }
                });
            }

            order.status = 'CREATED';
            await order.save();

            // Log activity — adminId required; skip for staff (no admin session)
            if (!isStaff && resolvedAdminId) {
                await AdminActivity.logActivity({
                    adminId: resolvedAdminId,
                    sessionId: (auth as any).session?._id,
                    action: 'ORDER_BOOK_ON_BEHALF',
                    description: `Admin booked order for user ${userId}`,
                    resource: 'orders',
                    endpoint: '/api/admin/orders/book-on-behalf',
                    method: 'POST',
                    ipAddress: req.headers.get('x-forwarded-for') || '0.0.0.0',
                    userAgent: req.headers.get('user-agent') || 'unknown',
                    statusCode: 201,
                    responseTime: Date.now() - startTime,
                    metadata: { orderId, targetUserId: userId }
                });
            }

            return NextResponse.json({ success: true, message: 'Order created successfully', order });

        } catch (thyrocareError: any) {
            console.error('[book-on-behalf] Thyrocare error:', thyrocareError.stack || thyrocareError.message);
            order.thyrocare.error = thyrocareError.message;
            order.status = 'FAILED';
            await order.save();

            return NextResponse.json({
                success: false,
                message: thyrocareError.message || 'Order created locally but failed in Thyrocare',
                error: thyrocareError.message,
                orderId: order.orderId
            }, { status: 400 });
        }

    } catch (error: any) {
        console.error('[book-on-behalf] Unhandled error:', error.stack || error.message);
        return NextResponse.json({ success: false, error: error.message || 'Failed to book on behalf' }, { status: 500 });
    }
}

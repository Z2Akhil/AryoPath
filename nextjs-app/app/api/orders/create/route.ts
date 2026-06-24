import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import connectToDatabase from '@/lib/db/mongoose';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import { ThyrocareService } from '@/lib/services/thyrocare';

// Helper to get user from token
const getUserFromToken = async (token: string | null) => {
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { id: string };
        const user = await User.findById(decoded.id).select('-password');
        if (user && user.isActive && user.isVerified) {
            return user;
        }
    } catch {
        // Invalid token
    }
    return null;
};

// Create order in Thyrocare system via ThyrocareService
// (includes circuit breaker, rate-limit queue, and auto-token-refresh)
const createThyrocareOrder = async (order: any) => {
    return await ThyrocareService.makeRequest(async (apiKey) => {
        // ref_code must be the registered DSA mobile — fetch from active session
        const AdminSessionModel = (await import('@/lib/models/AdminSession')).default;
        const activeSession = await AdminSessionModel.findOne({ isActive: true }).populate('adminId').lean();
        const refCode = (activeSession as any)?.adminId?.mobile || '';

        const payload = {
            api_key: apiKey,
            ref_order_id: order.orderId,
            email: order.contactInfo.email,
            mobile: order.contactInfo.mobile,
            address: `${order.contactInfo.address.street}, ${order.contactInfo.address.city}, ${order.contactInfo.address.state}`,
            appt_date: `${order.appointment.date} ${order.appointment.slot.split(' - ')[0]}`,
            order_by: (order.beneficiaries[0]?.name || 'Customer').replace(/[^a-zA-Z0-9]/g, '') || 'Customer',
            passon: order.package.discountAmount,
            pay_type: 'POSTPAID',
            pincode: order.contactInfo.address.pincode,
            products: Array.isArray(order.package.code) ? order.package.code.join(',') : order.package.code,
            ref_code: refCode,
            reports: order.reportsHardcopy,
            service_type: 'HOME',
            ben_data: order.beneficiaries.map((beneficiary: any) => ({
                name: beneficiary.name,
                age:  beneficiary.age,
                gender: beneficiary.gender === 'Male' ? 'M' : beneficiary.gender === 'Female' ? 'F' : 'O'
            })),
            coupon: '',
            order_mode: 'DSA-BOOKING-API',
            collection_type: 'Home Collection',
            source: 'Ayropath',
            phlebo_notes: ''
        };

        console.log('[orders/create] Placing Thyrocare order:', {
            orderId: order.orderId,
            package: order.package.code,
            beneficiaries: order.beneficiaries.length
        });

        const response = await axios.post(
            'https://dx-dsa-service.thyrocare.com/api/booking-master/v2/create-order',
            payload,
            { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
        );

        if (response.data.response_status === 1) {
            console.log('[orders/create] Thyrocare order created:', response.data.order_no);
            return response.data;
        } else {
            const msg = response.data.response || 'Thyrocare order creation failed';
            throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
    }).catch((error: any) => {
        const thyrocareMsg = error.response?.data?.response?.message || error.response?.data?.response || error.message;
        throw new Error(typeof thyrocareMsg === 'string' ? thyrocareMsg : JSON.stringify(thyrocareMsg));
    });
};

// POST /api/orders/create - Create a new order
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const token = req.headers.get('authorization')?.replace('Bearer', '').trim() || null;
        const user = await getUserFromToken(token);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const {
            packageId,
            packageName,
            packagePrice,
            totalAmount,
            originalPrice,
            discountPercentage,
            discountAmount,
            beneficiaries,
            contactInfo,
            appointment,
            selectedSlot,
            reports
        } = await req.json();

        // Validate required fields
        if (!packageId || !packageName || !totalAmount || !beneficiaries || !contactInfo || !appointment) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Generate order ID
        const orderId = Order.generateOrderId();

        // Create local DB record first
        const order = new Order({
            orderId,
            userId: user._id,
            package: {
                code: packageId,
                name: packageName,
                price: packagePrice,
                originalPrice: originalPrice,
                discountPercentage: discountPercentage,
                discountAmount: discountAmount
            },
            beneficiaries: beneficiaries.map((b: any) => ({
                name: b.name,
                age: parseInt(b.age),
                gender: b.gender
            })),
            contactInfo: {
                email: (contactInfo.email && contactInfo.email.trim() !== '') ? contactInfo.email.trim() : 'no-reply@ayropath.com',
                mobile: contactInfo.mobile,
                address: {
                    street: contactInfo.address.street,
                    city: contactInfo.address.city,
                    state: contactInfo.address.state,
                    pincode: contactInfo.address.pincode,
                    landmark: contactInfo.address.landmark || ''
                }
            },
            appointment: {
                date: appointment.date,
                slot: selectedSlot,
                slotId: appointment.slotId
            },
            reportsHardcopy: reports,
            payment: {
                amount: totalAmount,
                type: 'POSTPAID'
            },
            source: 'Ayropath'
        });

        console.log('Order created in database:', orderId);
        await order.save();

        // Create order in Thyrocare (uses ThyrocareService: circuit breaker + rate-limit queue + auto-refresh)
        try {
            const thyrocareResponse = await createThyrocareOrder(order);

            // Update order with Thyrocare response
            order.thyrocare.orderNo = thyrocareResponse.order_no;
            order.thyrocare.response = thyrocareResponse;

            // Update beneficiary lead IDs if available
            if (thyrocareResponse.ben_data && thyrocareResponse.ben_data.length > 0) {
                thyrocareResponse.ben_data.forEach((benData: any, index: number) => {
                    if (order.beneficiaries[index]) {
                        order.beneficiaries[index].leadId = benData.lead_id;
                    }
                });
            }

            order.status = 'CREATED';
            await order.save();

            return NextResponse.json({
                success: true,
                message: 'Order created successfully',
                data: {
                    orderId: order.orderId,
                    thyrocareOrderNo: order.thyrocare.orderNo,
                    order: order
                }
            }, { status: 201 });

        } catch (thyrocareError: any) {
            // Thyrocare order creation failed, but we still have our order record
            order.thyrocare.error = thyrocareError.message;
            order.status = 'FAILED';
            await order.save();

            return NextResponse.json({
                success: false,
                message: 'Order created in our system but failed in Thyrocare',
                data: {
                    orderId: order.orderId,
                    error: thyrocareError.message
                }
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Error creating order:', error);
        const message = error instanceof Error ? error.message : 'Failed to create order';
        return NextResponse.json({ success: false, message, error: message }, { status: 500 });
    }
}

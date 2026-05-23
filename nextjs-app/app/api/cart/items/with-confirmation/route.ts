import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongoose';
import Cart from '@/lib/models/Cart';
import User from '@/lib/models/User';
import Test from '@/lib/models/Test';
import Profile from '@/lib/models/Profile';
import Offer from '@/lib/models/Offer';

const generateGuestSessionId = () =>
    `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getUserFromToken = async (token: string | null) => {
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { id: string };
        const user = await User.findById(decoded.id).select('-password');
        if (user && user.isActive && user.isVerified) return user;
    } catch {
        // invalid token — treat as guest
    }
    return null;
};

const getProductDetails = async (productCode: string, productType: string) => {
    let product;
    switch (productType) {
        case 'TEST':
            product = await Test.findOne({ code: productCode, isActive: true });
            break;
        case 'PROFILE':
        case 'POP':
            product = await Profile.findOne({ code: productCode, isActive: true });
            break;
        case 'OFFER':
            product = await Offer.findOne({ code: productCode, isActive: true });
            break;
        default:
            throw new Error(`Unknown product type: ${productType}`);
    }

    if (!product) throw new Error(`Product not found: ${productCode} (${productType})`);

    const combinedData = product.getCombinedData ? product.getCombinedData() : product;

    let originalPrice: number;
    if (productType === 'OFFER') {
        originalPrice = combinedData.rate?.offerRate || combinedData.thyrocareRate || 0;
    } else {
        originalPrice = combinedData.rate?.b2C || combinedData.thyrocareRate || 0;
    }

    const thyrocareRate = combinedData.thyrocareRate || originalPrice;
    const sellingPrice = combinedData.sellingPrice || originalPrice;
    const discount = Math.max(0, originalPrice - sellingPrice);

    return {
        productCode: product.code,
        productType,
        name: product.name,
        originalPrice,
        sellingPrice,
        discount,
        thyrocareRate,
    };
};

// POST /api/cart/items/with-confirmation
// Removes specified duplicate TEST items then adds the new product atomically.
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const body = await req.json();
        const { productCode, productType, quantity = 1, removeDuplicateTests = [] } = body;

        if (!productCode || !productType) {
            return NextResponse.json(
                { success: false, message: 'Product code and type are required' },
                { status: 400 }
            );
        }

        const token = req.headers.get('authorization')?.replace('Bearer', '').trim() || null;
        const cookieStore = cookies();
        const guestSessionId =
            req.headers.get('x-guest-session-id') ||
            (await cookieStore).get('guestSessionId')?.value;

        const user = await getUserFromToken(token);
        const productDetails = await getProductDetails(productCode, productType);

        let cart = await Cart.findByUserOrGuest(user?._id, guestSessionId);
        if (!cart) {
            cart = await Cart.createOrUpdateCart(
                user?._id || null,
                guestSessionId || generateGuestSessionId(),
                []
            );
        }

        // Remove specified duplicate individual tests
        if (removeDuplicateTests.length > 0) {
            cart.items = (cart.items as any[]).filter(
                (item: { productType: string; productCode: string }) =>
                    !(item.productType === 'TEST' && removeDuplicateTests.includes(item.productCode))
            );
        }

        // Enforce single-offer rule
        if (productType === 'OFFER') {
            const existingOffer = (cart.items as any[]).find(
                (item: { productType: string; productCode: string }) =>
                    item.productType === 'OFFER' && item.productCode !== productCode
            );
            if (existingOffer) {
                return NextResponse.json(
                    { success: false, message: 'Only one offer is allowed per cart' },
                    { status: 400 }
                );
            }
        }

        // Add new item if not already present
        const existing = (cart.items as any[]).find(
            (i: { productCode: string; productType: string }) =>
                i.productCode === productCode && i.productType === productType
        );
        if (!existing) {
            cart.items.push({ ...productDetails, quantity: quantity || 1, addedAt: new Date() });
        }

        await cart.save();
        const summary = cart.getSummary();

        return NextResponse.json({
            success: true,
            message: 'Item added to cart successfully',
            cart: summary,
            guestSessionId: cart.guestSessionId,
        });
    } catch (error) {
        console.error('Error in with-confirmation cart handler:', error);
        const message = error instanceof Error ? error.message : 'Failed to add item to cart';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}

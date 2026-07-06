import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongoose';
import Cart from '@/lib/models/Cart';
import User from '@/lib/models/User';
import Test from '@/lib/models/Test';
import Profile from '@/lib/models/Profile';
import Offer from '@/lib/models/Offer';

// Helper to generate guest session ID
const generateGuestSessionId = () => {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

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
    // Invalid token, continue as guest
  }
  return null;
};

// Helper to get product details
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

  if (!product) {
    throw new Error(`Product not found: ${productCode} (${productType})`);
  }

  const combinedData = product.getCombinedData ? product.getCombinedData() : product;
  
  // Match legacy getProductDisplayPrice logic:
  // For OFFERs: offerRate is the original price (MRP of the offer)
  // For TESTs/PROFILEs: b2C is the original price (MRP)
  let originalPrice: number;
  if (productType === 'OFFER') {
    originalPrice = combinedData.rate?.offerRate || combinedData.thyrocareRate || 0;
  } else {
    originalPrice = combinedData.rate?.b2C || combinedData.thyrocareRate || 0;
  }
  
  // thyrocareRate is what we send to Thyrocare API for cart validation
  const thyrocareRate = combinedData.thyrocareRate || originalPrice;
  const sellingPrice = combinedData.sellingPrice || originalPrice;
  const discount = Math.max(0, originalPrice - sellingPrice);

  return {
    productCode: product.code,
    productType: productType,
    name: product.name,
    originalPrice: originalPrice,
    sellingPrice: sellingPrice,
    discount: discount,
    thyrocareRate: thyrocareRate
  };
};

// GET /api/cart - Get user's cart
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const token = req.headers.get('authorization')?.replace('Bearer', '').trim() || null;
    const cookieStore = cookies();
    const guestSessionId = req.headers.get('x-guest-session-id') || (await cookieStore).get('guestSessionId')?.value;

    const user = await getUserFromToken(token);

    let cart = await Cart.findByUserOrGuest(user?._id, guestSessionId);

    if (!cart) {
      cart = await Cart.createOrUpdateCart(
        user?._id || null,
        guestSessionId || generateGuestSessionId(),
        []
      );
    }

    // Ensure cart belongs to user if logged in
    if (user && !cart.userId) {
      cart.userId = user._id;
      await cart.save();
    }

    // Re-price the cart against the current catalog. Cart items store a price snapshot
    // from when they were added; the nightly Thyrocare sync can change prices (or deactivate
    // products) afterwards. Refresh each item to the live price so the cart never shows stale
    // amounts, and drop items whose product is no longer available/bookable.
    let repriced = false;
    const keptItems: any[] = [];
    for (const item of cart.items) {
      try {
        const fresh = await getProductDetails(item.productCode, item.productType);
        if (
          item.sellingPrice !== fresh.sellingPrice ||
          item.originalPrice !== fresh.originalPrice ||
          item.thyrocareRate !== fresh.thyrocareRate
        ) {
          item.originalPrice = fresh.originalPrice;
          item.sellingPrice  = fresh.sellingPrice;
          item.discount      = fresh.discount;
          item.thyrocareRate = fresh.thyrocareRate;
          item.name          = fresh.name;
          repriced = true;
        }
        keptItems.push(item);
      } catch {
        // Product was deactivated / removed by a sync since it was added → drop it (unbookable)
        repriced = true;
      }
    }
    if (repriced) {
      cart.items = keptItems as any;
      await cart.save();
    }

    const summary = cart.getSummary();

    return NextResponse.json({
      success: true,
      cart: summary,
      guestSessionId: cart.guestSessionId
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch cart';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// POST /api/cart/items - Add item to cart
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { productCode, productType, quantity = 1 } = body;

    if (!productCode || !productType) {
      return NextResponse.json(
        { success: false, message: 'Product code and type are required' },
        { status: 400 }
      );
    }

    const token = req.headers.get('authorization')?.replace('Bearer', '').trim() || null;
    const cookieStore = cookies();
    const guestSessionId = req.headers.get('x-guest-session-id') || (await cookieStore).get('guestSessionId')?.value;

    const user = await getUserFromToken(token);

    // Get product details
    const productDetails = await getProductDetails(productCode, productType);

    // Find or create cart
    let cart = await Cart.findByUserOrGuest(user?._id, guestSessionId);
    if (!cart) {
      cart = await Cart.createOrUpdateCart(user?._id || null, guestSessionId || generateGuestSessionId(), []);
    }

    // Check if product already exists
    const existing = cart.items.find(
      (i: { productCode: string; productType: string }) => i.productCode === productCode && i.productType === productType
    );

    if (existing) {
      await cart.save();
      const summary = cart.getSummary();
      return NextResponse.json({
        success: true,
        message: 'Product already in cart',
        cart: summary,
        guestSessionId: cart.guestSessionId,
        alreadyInCart: true
      });
    }

    // Add new item (quantity always 1)
    cart.items.push({ ...productDetails, quantity: 1, addedAt: new Date() });
    await cart.save();

    const summary = cart.getSummary();

    return NextResponse.json({
      success: true,
      message: 'Item added to cart successfully',
      cart: summary,
      guestSessionId: cart.guestSessionId
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    const message = error instanceof Error ? error.message : 'Failed to add item to cart';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// DELETE /api/cart - Clear cart
export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();

    const token = req.headers.get('authorization')?.replace('Bearer', '').trim() || null;
    const cookieStore = cookies();
    const guestSessionId = req.headers.get('x-guest-session-id') || (await cookieStore).get('guestSessionId')?.value;

    const user = await getUserFromToken(token);

    const cart = await Cart.findByUserOrGuest(user?._id, guestSessionId);

    if (!cart) {
      return NextResponse.json({ success: false, message: 'Cart not found' }, { status: 404 });
    }

    await cart.clearCart();

    return NextResponse.json({
      success: true,
      message: 'Cart cleared successfully',
      cart: {
        totalItems: 0,
        subtotal: 0,
        totalDiscount: 0,
        totalAmount: 0,
        items: []
      },
      guestSessionId: cart.guestSessionId
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    const message = error instanceof Error ? error.message : 'Failed to clear cart';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
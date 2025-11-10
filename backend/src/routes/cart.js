import express from 'express';
import jwt from 'jsonwebtoken';
import Cart from '../models/Cart.js';
import Test from '../models/Test.js';
import Profile from '../models/Profile.js';
import Offer from '../models/Offer.js';
import User from '../models/User.js';

// Optional auth middleware that doesn't require authentication
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer", "").trim();
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      
      if (user && user.isActive && user.isVerified) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

// Required auth middleware
const requiredAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer", "").trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid token or user not found.",
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your mobile number first.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

const router = express.Router();

// Helper function to generate guest session ID
const generateGuestSessionId = () => {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to get product details
const getProductDetails = async (productCode, productType) => {
  let product;
  
  switch (productType) {
    case 'TEST':
      product = await Test.findOne({ code: productCode, isActive: true });
      break;
    case 'PROFILE':
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
  
  const combinedData = product.getCombinedData();
  
  // Calculate proper prices based on the actual data structure
  const originalPrice = combinedData.rate?.b2C || 0;
  const sellingPrice = combinedData.sellingPrice || combinedData.rate?.offerRate || 0;
  const discount = originalPrice > sellingPrice ? originalPrice - sellingPrice : 0;
  
  return {
    productCode: product.code,
    productType: productType,
    name: product.name,
    originalPrice: originalPrice,
    sellingPrice: sellingPrice,
    discount: discount
  };
};

// Get user's cart
router.get('/', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?._id;
    const guestSessionId = req.headers['x-guest-session-id'] || req.cookies?.guestSessionId;
    
    console.log('🔍 Fetching cart:', {
      userId: userId || 'guest',
      guestSessionId: guestSessionId ? 'provided' : 'not provided'
    });
    
    let cart = await Cart.findByUserOrGuest(userId, guestSessionId);
    
    if (!cart) {
      // Create empty cart if none exists
      cart = await Cart.createOrUpdateCart(
        userId, 
        guestSessionId || generateGuestSessionId(), 
        []
      );
      
      console.log('🆕 Created new cart:', {
        cartId: cart._id,
        userId: userId || 'guest',
        guestSessionId: cart.guestSessionId
      });
    }
    
    const summary = cart.getSummary();
    
    res.json({
      success: true,
      cart: summary,
      guestSessionId: cart.guestSessionId
    });
    
  } catch (error) {
    console.error('❌ Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart',
      error: error.message
    });
  }
});

// Add item to cart
router.post('/items', optionalAuth, async (req, res) => {
  try {
    const { productCode, productType, quantity = 1 } = req.body;
    const userId = req.user?._id;
    const guestSessionId = req.headers['x-guest-session-id'] || req.cookies?.guestSessionId;
    
    console.log('➕ Adding item to cart:', {
      productCode,
      productType,
      quantity,
      userId: userId || 'guest'
    });
    
    if (!productCode || !productType) {
      return res.status(400).json({
        success: false,
        message: 'Product code and type are required'
      });
    }
    
    // Get product details
    const productDetails = await getProductDetails(productCode, productType);
    
    // Find or create cart
    let cart = await Cart.findByUserOrGuest(userId, guestSessionId);
    
    if (!cart) {
      cart = await Cart.createOrUpdateCart(
        userId, 
        guestSessionId || generateGuestSessionId(), 
        []
      );
    }
    
    // Add item to cart
    await cart.addItem({
      ...productDetails,
      quantity: parseInt(quantity)
    });
    
    const summary = cart.getSummary();
    
    console.log('✅ Item added to cart:', {
      cartId: cart._id,
      totalItems: summary.totalItems,
      totalAmount: summary.totalAmount
    });
    
    res.json({
      success: true,
      message: 'Item added to cart successfully',
      cart: summary,
      guestSessionId: cart.guestSessionId
    });
    
  } catch (error) {
    console.error('❌ Error adding item to cart:', error);
    
    if (error.message.includes('Product not found')) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to add item to cart',
        error: error.message
      });
    }
  }
});

// Update item quantity
router.put('/items/:productCode', optionalAuth, async (req, res) => {
  try {
    const { productCode } = req.params;
    const { productType, quantity } = req.body;
    const userId = req.user?._id;
    const guestSessionId = req.headers['x-guest-session-id'] || req.cookies?.guestSessionId;
    
    console.log('🔄 Updating cart item:', {
      productCode,
      productType,
      quantity,
      userId: userId || 'guest'
    });
    
    if (!productType || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Product type and quantity are required'
      });
    }
    
    const cart = await Cart.findByUserOrGuest(userId, guestSessionId);
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    await cart.updateQuantity(productCode, productType, parseInt(quantity));
    
    const summary = cart.getSummary();
    
    console.log('✅ Cart item updated:', {
      cartId: cart._id,
      totalItems: summary.totalItems,
      totalAmount: summary.totalAmount
    });
    
    res.json({
      success: true,
      message: 'Cart item updated successfully',
      cart: summary,
      guestSessionId: cart.guestSessionId
    });
    
  } catch (error) {
    console.error('❌ Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: error.message
    });
  }
});

// Remove item from cart
router.delete('/items/:productCode', optionalAuth, async (req, res) => {
  try {
    const { productCode } = req.params;
    const { productType } = req.body;
    const userId = req.user?._id;
    const guestSessionId = req.headers['x-guest-session-id'] || req.cookies?.guestSessionId;
    
    console.log('🗑️ Removing item from cart:', {
      productCode,
      productType,
      userId: userId || 'guest'
    });
    
    if (!productType) {
      return res.status(400).json({
        success: false,
        message: 'Product type is required'
      });
    }
    
    const cart = await Cart.findByUserOrGuest(userId, guestSessionId);
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    await cart.removeItem(productCode, productType);
    
    const summary = cart.getSummary();
    
    console.log('✅ Item removed from cart:', {
      cartId: cart._id,
      totalItems: summary.totalItems,
      totalAmount: summary.totalAmount
    });
    
    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      cart: summary,
      guestSessionId: cart.guestSessionId
    });
    
  } catch (error) {
    console.error('❌ Error removing item from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message
    });
  }
});

// Clear entire cart
router.delete('/', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?._id;
    const guestSessionId = req.headers['x-guest-session-id'] || req.cookies?.guestSessionId;
    
    console.log('🧹 Clearing cart:', {
      userId: userId || 'guest'
    });
    
    const cart = await Cart.findByUserOrGuest(userId, guestSessionId);
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    await cart.clearCart();
    
    console.log('✅ Cart cleared:', {
      cartId: cart._id
    });
    
    res.json({
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
    console.error('❌ Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
});

// Merge guest cart with user cart (when user logs in)
router.post('/merge', requiredAuth, async (req, res) => {
  try {
    const { guestSessionId } = req.body;
    const userId = req.user._id;
    
    console.log('🔄 Merging carts:', {
      userId,
      guestSessionId
    });
    
    if (!guestSessionId) {
      return res.status(400).json({
        success: false,
        message: 'Guest session ID is required'
      });
    }
    
    // Find guest cart
    const guestCart = await Cart.findOne({ guestSessionId, isActive: true });
    
    if (!guestCart) {
      return res.status(404).json({
        success: false,
        message: 'Guest cart not found'
      });
    }
    
    // Find or create user cart
    let userCart = await Cart.findOne({ userId, isActive: true });
    
    if (!userCart) {
      userCart = new Cart({
        userId,
        items: guestCart.items
      });
    } else {
      // Merge items from guest cart to user cart
      for (const guestItem of guestCart.items) {
        await userCart.addItem(guestItem);
      }
    }
    
    await userCart.save();
    
    // Deactivate guest cart
    guestCart.isActive = false;
    await guestCart.save();
    
    const summary = userCart.getSummary();
    
    console.log('✅ Carts merged successfully:', {
      userId,
      totalItems: summary.totalItems,
      totalAmount: summary.totalAmount
    });
    
    res.json({
      success: true,
      message: 'Cart merged successfully',
      cart: summary
    });
    
  } catch (error) {
    console.error('❌ Error merging carts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to merge carts',
      error: error.message
    });
  }
});

export { optionalAuth, requiredAuth };
export default router;

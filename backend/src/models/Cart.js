import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  productCode: {
    type: String,
    required: true
  },
  productType: {
    type: String,
    enum: ['TEST', 'PROFILE', 'OFFER'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  originalPrice: {
    type: Number,
    required: true
  },
  sellingPrice: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for guest carts
  },
  guestSessionId: {
    type: String,
    required: false // For guest users
  },
  items: [cartItemSchema],
  totalItems: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    default: 0
  },
  totalDiscount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
cartSchema.index({ userId: 1 });
cartSchema.index({ guestSessionId: 1 });
cartSchema.index({ lastUpdated: 1 });

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.subtotal = this.items.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
  this.totalDiscount = this.items.reduce((sum, item) => sum + ((item.originalPrice - item.sellingPrice) * item.quantity), 0);
  this.totalAmount = this.items.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  this.lastUpdated = new Date();
  next();
});

// Static method to find cart by user or guest session
cartSchema.statics.findByUserOrGuest = async function(userId, guestSessionId) {
  if (userId) {
    return await this.findOne({ userId, isActive: true });
  } else if (guestSessionId) {
    return await this.findOne({ guestSessionId, isActive: true });
  }
  return null;
};

// Static method to create or update cart
cartSchema.statics.createOrUpdateCart = async function(userId, guestSessionId, items = []) {
  let cart = await this.findByUserOrGuest(userId, guestSessionId);
  
  if (!cart) {
    cart = new this({
      userId: userId || null,
      guestSessionId: guestSessionId || null,
      items: items
    });
  } else {
    cart.items = items;
  }
  
  await cart.save();
  return cart;
};

// Method to add item to cart
cartSchema.methods.addItem = async function(itemData) {
  const existingItemIndex = this.items.findIndex(
    item => item.productCode === itemData.productCode && item.productType === itemData.productType
  );
  
  if (existingItemIndex > -1) {
    // Update existing item
    this.items[existingItemIndex].quantity += itemData.quantity || 1;
    this.items[existingItemIndex].sellingPrice = itemData.sellingPrice;
    this.items[existingItemIndex].discount = itemData.discount;
  } else {
    // Add new item
    this.items.push({
      productCode: itemData.productCode,
      productType: itemData.productType,
      name: itemData.name,
      quantity: itemData.quantity || 1,
      originalPrice: itemData.originalPrice,
      sellingPrice: itemData.sellingPrice,
      discount: itemData.discount
    });
  }
  
  await this.save();
  return this;
};

// Method to remove item from cart
cartSchema.methods.removeItem = async function(productCode, productType) {
  this.items = this.items.filter(
    item => !(item.productCode === productCode && item.productType === productType)
  );
  
  await this.save();
  return this;
};

// Method to update item quantity
cartSchema.methods.updateQuantity = async function(productCode, productType, quantity) {
  const item = this.items.find(
    item => item.productCode === productCode && item.productType === productType
  );
  
  if (item && quantity > 0 && quantity <= 10) {
    item.quantity = quantity;
    await this.save();
  }
  
  return this;
};

// Method to clear cart
cartSchema.methods.clearCart = async function() {
  this.items = [];
  await this.save();
  return this;
};

// Method to get cart summary
cartSchema.methods.getSummary = function() {
  return {
    totalItems: this.totalItems,
    subtotal: this.subtotal,
    totalDiscount: this.totalDiscount,
    totalAmount: this.totalAmount,
    items: this.items.map(item => ({
      productCode: item.productCode,
      productType: item.productType,
      name: item.name,
      quantity: item.quantity,
      originalPrice: item.originalPrice,
      sellingPrice: item.sellingPrice,
      discount: item.discount,
      totalPrice: item.sellingPrice * item.quantity
    }))
  };
};

export default mongoose.model('Cart', cartSchema);

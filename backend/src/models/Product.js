import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  // Core Identification
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['TEST', 'PROFILE', 'OFFER'],
    required: true
  },
  
  thyrocareData: {
    // Basic info
    aliasName: String,
    testCount: Number,
    benMin: Number,
    benMax: Number,
    benMultiple: Number,
    payType: String,
    
    // Specimen info
    serum: String,
    edta: String,
    urine: String,
    fluoride: String,
    fasting: String,
    specimenType: String,
    
    // Medical info
    diseaseGroup: String,
    units: String,
    volume: String,
    normalVal: String,
    groupName: String,
    category: String,
    
    // Business info
    new: String,
    hc: String,
    testNames: String,
    additionalTests: String,
    validTo: Date,
    hcrInclude: Number,
    ownPkg: String,
    bookedCount: Number,
    barcodes: [String],
    
    // Pricing (from ThyroCare)
    rate: {
      b2B: Number,
      b2C: Number,        // Customer face price
      offerRate: Number,  // Current selling price
      id: String,
      payAmt: Number,
      payAmt1: Number
    },
    margin: Number,       // Maximum possible discount
    
    // Child products (for PROFILE and OFFER)
    childs: [{
      name: String,
      code: String,
      groupName: String,
      type: String,
      // Additional fields that might come from ThyroCare
      aliasName: String,
      testCount: Number,
      rate: {
        b2B: Number,
        b2C: Number,
        offerRate: Number,
        id: String,
        payAmt: Number,
        payAmt1: Number
      },
      margin: Number
    }]
  },
  
  // Our Custom Pricing (editable by admin)
  customPricing: {
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    sellingPrice: {
      type: Number,
      default: function() {
        // Auto-calculate: thyrocare rate - discount
        return (this.thyrocareData.rate?.b2C || 0) - (this.customPricing?.discount || 0);
      }
    },
    isCustomized: {
      type: Boolean,
      default: false
    }
  },
  
  // Status and Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  lastSynced: {
    type: Date,
    default: Date.now
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
productSchema.index({ code: 1 });
productSchema.index({ type: 1, isActive: 1 });
productSchema.index({ 'thyrocareData.category': 1 });

// Pre-save hook to auto-calculate selling price and validate discount
productSchema.pre('save', function(next) {
  if (this.isModified('customPricing.discount')) {
    const thyrocareRate = this.thyrocareData.rate?.b2C || 0;
    const thyrocareMargin = this.thyrocareData.margin || 0;
    const discount = this.customPricing.discount || 0;
    
    // Validate discount doesn't exceed margin
    if (discount > thyrocareMargin) {
      return next(new Error(`Discount cannot exceed ThyroCare margin of ${thyrocareMargin}`));
    }
    
    this.customPricing.sellingPrice = thyrocareRate - discount;
    this.customPricing.isCustomized = discount > 0;
  }
  this.updatedAt = Date.now();
  next();
});

productSchema.statics.findOrCreateFromThyroCare = async function (thyrocareProduct) {
  try {
    let product = await this.findOne({ code: thyrocareProduct.code });
    const cleanedThyrocareData = { ...thyrocareProduct };

    const numericFields = ['testCount', 'benMin', 'benMax', 'benMultiple', 'hcrInclude', 'bookedCount', 'margin'];
    numericFields.forEach(f => {
      if (cleanedThyrocareData[f] != null) {
        const v = cleanedThyrocareData[f];
        cleanedThyrocareData[f] = (typeof v === 'string' && v.trim() !== '') ? Number(v) : (v === '' || v == null ? 0 : v);
      }
    });

    if (cleanedThyrocareData.rate) {
      ['b2B', 'b2C', 'offerRate', 'payAmt', 'payAmt1'].forEach(f => {
        if (cleanedThyrocareData.rate[f] != null) {
          const v = cleanedThyrocareData.rate[f];
          cleanedThyrocareData.rate[f] = (typeof v === 'string' && v.trim() !== '') ? Number(v) : (v === '' || v == null ? 0 : v);
        }
      });
      cleanedThyrocareData.rate = {
        b2B: cleanedThyrocareData.rate.b2B || 0,
        b2C: cleanedThyrocareData.rate.b2C || 0,
        offerRate: cleanedThyrocareData.rate.offerRate || 0,
        id: cleanedThyrocareData.rate.id || '',
        payAmt: cleanedThyrocareData.rate.payAmt || 0,
        payAmt1: cleanedThyrocareData.rate.payAmt1 || 0
      };
    } else {
      cleanedThyrocareData.rate = { b2B: 0, b2C: 0, offerRate: 0, id: '', payAmt: 0, payAmt1: 0 };
    }

    if (Array.isArray(cleanedThyrocareData.childs)) {
      cleanedThyrocareData.childs = cleanedThyrocareData.childs.map(child => {
        if (!child || typeof child !== 'object') {
          return { name: '', code: '', groupName: '', type: '', aliasName: '', testCount: 0, rate: { b2B: 0, b2C: 0, offerRate: 0, id: '', payAmt: 0, payAmt1: 0 }, margin: 0 };
        }
        ['testCount', 'margin'].forEach(f => {
          if (child[f] != null) {
            const v = child[f];
            child[f] = (typeof v === 'string' && v.trim() !== '') ? Number(v) : (v === '' || v == null ? 0 : v);
          }
        });
        if (child.rate) {
          ['b2B', 'b2C', 'offerRate', 'payAmt', 'payAmt1'].forEach(f => {
            if (child.rate[f] != null) {
              const v = child.rate[f];
              child.rate[f] = (typeof v === 'string' && v.trim() !== '') ? Number(v) : (v === '' || v == null ? 0 : v);
            }
          });
        }
        return {
          name: child.name || '',
          code: child.code || '',
          groupName: child.groupName || '',
          type: child.type || '',
          aliasName: child.aliasName || '',
          testCount: child.testCount || 0,
          rate: child.rate || { b2B: 0, b2C: 0, offerRate: 0, id: '', payAmt: 0, payAmt1: 0 },
          margin: child.margin || 0
        };
      });
    } else {
      cleanedThyrocareData.childs = [];
    }

    cleanedThyrocareData.type = (cleanedThyrocareData.type || '').trim().toUpperCase();
    if (!['TEST', 'PROFILE', 'OFFER'].includes(cleanedThyrocareData.type)) {
      console.warn(`Invalid product type: ${cleanedThyrocareData.type}, defaulting to TEST`);
      cleanedThyrocareData.type = 'TEST';
    }

    if (!product) {
      product = new this({
        code: cleanedThyrocareData.code,
        name: cleanedThyrocareData.name,
        type: cleanedThyrocareData.type,
        thyrocareData: cleanedThyrocareData
      });
    } else {
      product.thyrocareData = cleanedThyrocareData;
      product.lastSynced = new Date();
    }

    await product.save();
    return product;
  } catch (error) {
    console.error('Error in findOrCreateFromThyroCare:', error);
    console.error('ThyroCare product data that caused error:', thyrocareProduct);
    throw error;
  }
};

productSchema.methods.getCombinedData = function() {
  const basePrice = this.type === 'OFFER'
    ? (this.thyrocareData.rate?.offerRate || 0)
    : (this.thyrocareData.rate?.b2C || 0);

  const thyrocareMargin = this.thyrocareData.margin || 0;
  const discount = this.customPricing.discount || 0;
  const sellingPrice = this.customPricing.sellingPrice || basePrice;

  return {
    code: this.code,
    name: this.name,
    type: this.type,
    category: this.thyrocareData.category,
    thyrocareRate: basePrice,
    thyrocareMargin: thyrocareMargin,
    childs: this.thyrocareData.childs || [],
    discount: discount,
    sellingPrice: sellingPrice,
    isCustomized: this.customPricing.isCustomized,
    actualMargin: thyrocareMargin - (basePrice - sellingPrice),
    isActive: this.isActive,
    lastSynced: this.lastSynced
  };
};

productSchema.statics.updateCustomPricing = async function(code, discount) {
  try {
    const product = await this.findOne({ code });
    if (!product) {
      throw new Error('Product not found');
    }
    
    product.customPricing.discount = discount;
    await product.save();
    
    return product.getCombinedData();
  } catch (error) {
    throw error;
  }
};

export default mongoose.model('Product', productSchema);

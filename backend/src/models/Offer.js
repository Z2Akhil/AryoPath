import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['OFFER'], required: true },

  thyrocareData: {
    aliasName: String,
    testCount: Number,
    benMin: Number,
    benMax: Number,
    benMultiple: Number,
    payType: String,
    serum: String,
    edta: String,
    urine: String,
    fluoride: String,
    fasting: String,
    specimenType: String,
    diseaseGroup: String,
    units: String,
    volume: String,
    normalVal: String,
    groupName: String,
    category: String,
    new: String,
    hc: String,
    testNames: String,
    additionalTests: String,
    validTo: Date,
    hcrInclude: Number,
    ownPkg: String,
    bookedCount: Number,
    barcodes: [String],
    imageLocation: String,
    imageMaster: [{
      imgLocations: String,
      imgType: String,
      imgName: String
    }],
    rate: {
      b2B: Number,
      b2C: Number,
      offerRate: Number,
      id: String,
      payAmt: Number,
      payAmt1: Number
    },
    margin: Number,
    childs: [{
      name: {type:String, default:''},
      code: {type:String, default:''},
      groupName: {type:String, default:''},
      type: {type:String, default:''}
    }]
  },

  customPricing: {
    discount: { type: Number, default: 0, min: 0 },
    sellingPrice: { type: Number, default: 0 },
    isCustomized: { type: Boolean, default: false }
  },

  isActive: { type: Boolean, default: true },
  lastSynced: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for performance
offerSchema.index({ type: 1, isActive: 1 });
offerSchema.index({ 'thyrocareData.category': 1 });

// Pre-save hook to auto-calculate selling price
offerSchema.pre('save', function(next) {
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
  next();
});

offerSchema.statics.findOrCreateFromThyroCare = async function(thyrocareProduct) {
  try {
    console.log(`Processing OFFER product: ${thyrocareProduct.code}`);
    
    let offer = await this.findOne({ code: thyrocareProduct.code });
    
    // Clean up and validate the thyrocareProduct data before saving
    const cleanedThyrocareData = { ...thyrocareProduct };
    
    // Convert string numbers to actual numbers for numeric fields
    const numericFields = ['testCount', 'benMin', 'benMax', 'benMultiple', 'hcrInclude', 'bookedCount', 'margin'];
    numericFields.forEach(field => {
      if (cleanedThyrocareData[field] !== undefined && cleanedThyrocareData[field] !== null) {
        const value = cleanedThyrocareData[field];
        if (typeof value === 'string' && value.trim() !== '') {
          cleanedThyrocareData[field] = Number(value);
        } else if (value === '' || value === null) {
          cleanedThyrocareData[field] = 0;
        }
      }
    });
    
    // Handle rate object - convert string numbers to actual numbers
    if (cleanedThyrocareData.rate) {
      const rateNumericFields = ['b2B', 'b2C', 'offerRate', 'payAmt', 'payAmt1'];
      rateNumericFields.forEach(field => {
        if (cleanedThyrocareData.rate[field] !== undefined && cleanedThyrocareData.rate[field] !== null) {
          const value = cleanedThyrocareData.rate[field];
          if (typeof value === 'string' && value.trim() !== '') {
            cleanedThyrocareData.rate[field] = Number(value);
          } else if (value === '' || value === null) {
            cleanedThyrocareData.rate[field] = 0;
          }
        }
      });
      
      // Ensure rate object has all required fields
      cleanedThyrocareData.rate = {
        b2B: cleanedThyrocareData.rate.b2B || 0,
        b2C: cleanedThyrocareData.rate.b2C || 0,
        offerRate: cleanedThyrocareData.rate.offerRate || 0,
        id: cleanedThyrocareData.rate.id || '',
        payAmt: cleanedThyrocareData.rate.payAmt || 0,
        payAmt1: cleanedThyrocareData.rate.payAmt1 || 0
      };
    } else {
      // Create default rate object if missing
      cleanedThyrocareData.rate = {
        b2B: 0,
        b2C: 0,
        offerRate: 0,
        id: '',
        payAmt: 0,
        payAmt1: 0
      };
    }
    
    // Handle childs array - ensure it's properly formatted and validated
    if (cleanedThyrocareData.childs) {
      // Handle case where childs is a JSON string instead of array
      if (typeof cleanedThyrocareData.childs === 'string') {
        try {
          console.log('DEBUG: Attempting to parse childs as JSON string');
          // First try standard JSON parsing
          cleanedThyrocareData.childs = JSON.parse(cleanedThyrocareData.childs);
          console.log('DEBUG: Successfully parsed childs as JSON');
        } catch (parseError) {
          console.log('DEBUG: Standard JSON parsing failed, trying to fix malformed format');
          // If standard parsing fails, try to fix the malformed format
          try {
            // The string contains JavaScript object literal syntax, not JSON
            // We need to convert it to proper JSON
            let fixedChildsString = cleanedThyrocareData.childs
              .replace(/\\n/g, '') // Remove newlines
              .replace(/\\'/g, '"') // Replace single quotes with double quotes
              .replace(/(\w+):/g, '"$1":') // Add quotes around property names
              .replace(/,(\s*})/g, '$1'); // Remove trailing commas
            
            cleanedThyrocareData.childs = JSON.parse(fixedChildsString);
            console.log('DEBUG: Successfully parsed childs after fixing format');
          } catch (secondParseError) {
            console.error('DEBUG: Failed to parse childs even after fixing format:', secondParseError);
            console.error('DEBUG: Original childs string:', cleanedThyrocareData.childs);
            cleanedThyrocareData.childs = [];
          }
        }
      }
      
      if (Array.isArray(cleanedThyrocareData.childs)) {
        cleanedThyrocareData.childs = cleanedThyrocareData.childs.map(child => {
          if (!child || typeof child !== 'object') {
            return {
              name: '',
              code: '',
              groupName: '',
              type: ''
            };
          }
          // Create a new child object with proper structure
          const mappedChild = {
            name: child.name || '',
            code: child.code || '',
            groupName: child.groupName || '',
            type: child.type || ''
          };
          return mappedChild;
        });
      } else {
        console.warn('DEBUG: childs is not an array after parsing, setting to empty array');
        cleanedThyrocareData.childs = [];
      }
    } else {
      cleanedThyrocareData.childs = [];
    }
    
    // Ensure type is valid
    if (cleanedThyrocareData.type !== 'OFFER') {
      console.warn(`Invalid product type for Offer model: ${cleanedThyrocareData.type}, forcing to OFFER`);
      cleanedThyrocareData.type = 'OFFER';
    } 
    
    if (!offer) {
      offer = new this({
        code: cleanedThyrocareData.code,
        name: cleanedThyrocareData.name,
        type: cleanedThyrocareData.type,
        thyrocareData: cleanedThyrocareData
      });
    } else {
      // Update ThyroCare data but preserve custom pricing
      offer.thyrocareData = cleanedThyrocareData;
      offer.lastSynced = new Date();
    }
    
    await offer.save();
    return offer;
  } catch (error) {
    console.error('Error in Offer.findOrCreateFromThyroCare:', error);
    console.error('ThyroCare product data that caused error:', thyrocareProduct);
    throw error;
  }
};

// Method to get combined data for frontend
offerSchema.methods.getCombinedData = function() {
  const thyrocareRate = this.thyrocareData.rate?.b2C || 0;
  const thyrocareMargin = this.thyrocareData.margin || 0;
  const discount = this.customPricing.discount || 0;
  const sellingPrice = this.customPricing.sellingPrice || thyrocareRate;
  
  return {
    code: this.code,
    name: this.name,
    type: this.type,
    category: this.thyrocareData.category,
    
    // ThyroCare data
    thyrocareRate: thyrocareRate,
    thyrocareMargin: thyrocareMargin,
    childs: this.thyrocareData.childs || [],
    
    // Image data for client display
    imageLocation: this.thyrocareData.imageLocation,
    imageMaster: this.thyrocareData.imageMaster || [],
    
    // Additional product details
    testCount: this.thyrocareData.testCount,
    bookedCount: this.thyrocareData.bookedCount,
    specimenType: this.thyrocareData.specimenType,
    fasting: this.thyrocareData.fasting,
    
    // ThyroCare rate details for comparison
    rate: {
      b2C: this.thyrocareData.rate?.b2C || 0,
      offerRate: this.thyrocareData.rate?.offerRate || 0,
      payAmt: this.thyrocareData.rate?.payAmt || 0
    },
    
    // Our custom pricing
    discount: discount,
    sellingPrice: sellingPrice,
    isCustomized: this.customPricing.isCustomized,
    
    // Calculated fields
    actualMargin: thyrocareMargin - (thyrocareRate - sellingPrice),
    
    // Status
    isActive: this.isActive,
    lastSynced: this.lastSynced
  };
};

// Static method to update custom pricing
offerSchema.statics.updateCustomPricing = async function(code, discount) {
  try {
    const offer = await this.findOne({ code });
    if (!offer) {
      throw new Error('Offer not found');
    }
    
    offer.customPricing.discount = discount;
    await offer.save();
    
    return offer.getCombinedData();
  } catch (error) {
    throw error;
  }
};

export default mongoose.model('Offer', offerSchema);

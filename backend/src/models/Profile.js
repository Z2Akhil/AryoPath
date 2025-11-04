import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['PROFILE','POP'], required: true },

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
      name: { type: String, default: '' },
      code: { type: String, default: '' },
      groupName: { type: String, default: '' },
      type: { type: String, default: '' }
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
profileSchema.index({ type: 1, isActive: 1 });
profileSchema.index({ 'thyrocareData.category': 1 });

// Pre-save hook to auto-calculate selling price
profileSchema.pre('save', function(next) {
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

// Static method to find or create from ThyroCare data
profileSchema.statics.findOrCreateFromThyroCare = async function(thyrocareProduct) {
  try {
    
    let profile = await this.findOne({ code: thyrocareProduct.code });
    
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
          // First try standard JSON parsing
          cleanedThyrocareData.childs = JSON.parse(cleanedThyrocareData.childs);
        } catch (parseError) {
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
          } catch (secondParseError) {
            console.error('Failed to parse childs:', secondParseError);
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
        cleanedThyrocareData.childs = [];
      }
    } else {
      cleanedThyrocareData.childs = [];
    }
    
    // Ensure type is valid
    if (!['PROFILE','POP'].includes(cleanedThyrocareData.type)) {
      console.warn(`Invalid product type for Profile model: ${cleanedThyrocareData.type}, forcing to PROFILE`);
      cleanedThyrocareData.type = 'PROFILE';
    }
    
    if (!profile) {
      profile = new this({
        code: cleanedThyrocareData.code,
        name: cleanedThyrocareData.name,
        type: cleanedThyrocareData.type,
        thyrocareData: cleanedThyrocareData
      });
    } else {
      // Update ThyroCare data but preserve custom pricing
      profile.thyrocareData = cleanedThyrocareData;
      profile.lastSynced = new Date();
    }
    
    await profile.save();
    return profile;
  } catch (error) {
    console.error('Error in Profile.findOrCreateFromThyroCare:', error);
    console.error('ThyroCare product data that caused error:', thyrocareProduct);
    throw error;
  }
};

// Method to get combined data for frontend
profileSchema.methods.getCombinedData = function() {
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
profileSchema.statics.updateCustomPricing = async function(code, discount) {
  try {
    const profile = await this.findOne({ code });
    if (!profile) {
      throw new Error('Profile not found');
    }
    
    profile.customPricing.discount = discount;
    await profile.save();
    
    return profile.getCombinedData();
  } catch (error) {
    throw error;
  }
};

export default mongoose.model('Profile', profileSchema);

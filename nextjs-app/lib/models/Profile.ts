import mongoose, { Schema, Document } from 'mongoose';

export interface IProfile extends Document {
  code: string;
  name: string;
  type: 'PROFILE' | 'POP';
  thyrocareData: {
    aliasName?: string;
    testCount?: number;
    benMin?: number;
    benMax?: number;
    benMultiple?: number;
    payType?: string;
    serum?: string;
    edta?: string;
    urine?: string;
    fluoride?: string;
    fasting?: string;
    specimenType?: string;
    diseaseGroup?: string;
    units?: string;
    volume?: string;
    normalVal?: string;
    groupName?: string;
    category?: string;
    new?: string;
    hc?: string;
    testNames?: string;
    additionalTests?: string;
    validTo?: Date;
    hcrInclude?: number;
    ownPkg?: string;
    bookedCount?: number;
    barcodes?: string[];
    imageLocation?: string;
    imageMaster?: Array<{
      imgLocations?: string;
      imgType?: string;
      imgName?: string;
    }>;
    rate?: {
      b2B?: number;
      b2C?: number;
      offerRate?: number;
      id?: string;
      payAmt?: number;
      payAmt1?: number;
    };
    margin?: number;
    childs?: Array<{
      name?: string;
      code?: string;
      groupName?: string;
      type?: string;
    }>;
  };
  customPricing: {
    discount: number;
    sellingPrice: number;
    isCustomized: boolean;
  };
  isActive: boolean;
  isFeatured: boolean;
  featuredOrder: number;
  lastSynced: Date;
  getCombinedData(): any;
}

export interface IProfileModel extends mongoose.Model<IProfile> {
  updateCustomPricing(code: string, discount: number): Promise<unknown>;
  findOrCreateFromThyroCare(data: Record<string, unknown>): Promise<IProfile>;
}

const ProfileSchema = new Schema<IProfile, IProfileModel>(
  {
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['PROFILE', 'POP'], required: true },
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
    isFeatured: { type: Boolean, default: false, index: true },
    featuredOrder: { type: Number, default: 0 },
    lastSynced: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

ProfileSchema.index({ type: 1, isActive: 1 });
ProfileSchema.index({ isFeatured: 1, featuredOrder: 1 });
ProfileSchema.index({ 'thyrocareData.category': 1 });

// Pre-save hook to auto-calculate selling price
ProfileSchema.pre('save', async function () {
  if (this.isModified('customPricing.discount')) {
    const thyrocareRate = this.thyrocareData?.rate?.b2C || 0;
    const thyrocareMargin = this.thyrocareData?.margin || 0;
    const discount = this.customPricing.discount || 0;

    // Validate discount doesn't exceed margin
    if (discount > thyrocareMargin) {
      throw new Error(`Discount cannot exceed ThyroCare margin of ${thyrocareMargin}`);
    }

    this.customPricing.sellingPrice = thyrocareRate - discount;
    this.customPricing.isCustomized = discount > 0;
  }
});

ProfileSchema.methods.getCombinedData = function () {
  const thyrocareRate = this.thyrocareData?.rate?.b2C || 0;
  const thyrocareMargin = this.thyrocareData?.margin || 0;
  const discount = this.customPricing?.discount || 0;
  const sellingPrice = this.customPricing?.sellingPrice || thyrocareRate;

  return {
    code: this.code,
    name: this.name,
    type: this.type,
    category: this.thyrocareData?.category,
    thyrocareRate,
    thyrocareMargin,
    childs: this.thyrocareData?.childs || [],
    imageLocation: this.thyrocareData?.imageLocation,
    imageMaster: this.thyrocareData?.imageMaster || [],
    testCount: this.thyrocareData?.testCount,
    bookedCount: this.thyrocareData?.bookedCount,
    specimenType: this.thyrocareData?.specimenType,
    fasting: this.thyrocareData?.fasting,
    rate: {
      b2C: this.thyrocareData?.rate?.b2C || 0,
      offerRate: this.thyrocareData?.rate?.offerRate || 0,
      payAmt: this.thyrocareData?.rate?.payAmt || 0
    },
    discount,
    sellingPrice,
    isCustomized: this.customPricing?.isCustomized,
    actualMargin: thyrocareMargin - (thyrocareRate - sellingPrice),
    isActive: this.isActive,
    lastSynced: this.lastSynced
  };
};

ProfileSchema.statics.updateCustomPricing = async function (code: string, discount: number) {
  const profile = await this.findOne({ code });
  if (!profile) {
    throw new Error('Profile not found');
  }

  profile.customPricing.discount = discount;
  await profile.save();

  return profile.getCombinedData();
};

ProfileSchema.statics.findOrCreateFromThyroCare = async function (data: Record<string, any>) {
  try {
    const code = String(data.code);

    let profile = await this.findOne({ code });

    // Clean up and validate the thyrocare data before saving
    const cleanedThyrocareData = { ...data };

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

      cleanedThyrocareData.rate = {
        b2B: cleanedThyrocareData.rate.b2B || 0,
        b2C: cleanedThyrocareData.rate.b2C || 0,
        offerRate: cleanedThyrocareData.rate.offerRate || 0,
        id: cleanedThyrocareData.rate.id || '',
        payAmt: cleanedThyrocareData.rate.payAmt || 0,
        payAmt1: cleanedThyrocareData.rate.payAmt1 || 0
      };
    }

    // Handle barcodes array - Thyrocare now returns objects instead of plain strings
    if (cleanedThyrocareData.barcodes !== undefined) {
      if (typeof cleanedThyrocareData.barcodes === 'string') {
        try {
          cleanedThyrocareData.barcodes = JSON.parse(cleanedThyrocareData.barcodes);
        } catch {
          cleanedThyrocareData.barcodes = [];
        }
      }
      if (Array.isArray(cleanedThyrocareData.barcodes)) {
        cleanedThyrocareData.barcodes = cleanedThyrocareData.barcodes.map((b: any) => {
          if (typeof b === 'string') return b;
          if (b && typeof b === 'object') return String(b.code || b.specimenType || '');
          return String(b);
        });
      } else {
        cleanedThyrocareData.barcodes = [];
      }
    }

    // Handle childs array - ensure it's properly formatted and validated
    if (cleanedThyrocareData.childs) {
      // Handle case where childs is a JSON string instead of array
      if (typeof cleanedThyrocareData.childs === 'string') {
        try {
          cleanedThyrocareData.childs = JSON.parse(cleanedThyrocareData.childs);
        } catch (parseError) {
          try {
            let fixedChildsString = cleanedThyrocareData.childs
              .replace(/\\n/g, '')
              .replace(/\\'/g, '"')
              .replace(/(\w+):/g, '"$1":')
              .replace(/,(\s*})/g, '$1');

            cleanedThyrocareData.childs = JSON.parse(fixedChildsString);
          } catch (secondParseError) {
            console.error('Failed to parse childs:', secondParseError);
            cleanedThyrocareData.childs = [];
          }
        }
      }

      if (Array.isArray(cleanedThyrocareData.childs)) {
        cleanedThyrocareData.childs = cleanedThyrocareData.childs.map(child => ({
          name: child?.name || '',
          code: child?.code || '',
          groupName: child?.groupName || '',
          type: child?.type || ''
        }));
      } else {
        cleanedThyrocareData.childs = [];
      }
    } else {
      cleanedThyrocareData.childs = [];
    }

    if (!profile) {
      profile = new this({
        code: cleanedThyrocareData.code,
        name: cleanedThyrocareData.name,
        type: cleanedThyrocareData.type || 'PROFILE',
        thyrocareData: cleanedThyrocareData
      });
    } else {
      profile.thyrocareData = cleanedThyrocareData as IProfile['thyrocareData'];
      profile.lastSynced = new Date();
    }

    await profile.save();
    return profile;
  } catch (error) {
    console.error('Error in Profile.findOrCreateFromThyroCare:', error);
    throw error;
  }
};

export default (mongoose.models.Profile as IProfileModel) || mongoose.model<IProfile, IProfileModel>('Profile', ProfileSchema);

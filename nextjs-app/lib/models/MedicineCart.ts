import mongoose, { Schema, Document } from 'mongoose';

interface IMedicineCartItem {
    slug: string;
    name: string;
    mrp: number;
    offerPrice: number;
    type: string;
    quantity: number;
    thumbnail?: { url: string; publicId?: string };
    prescriptionRequired: boolean;
    addedAt: Date;
}

export interface MedicineCartDocument extends Document {
    userId: mongoose.Types.ObjectId;
    items: IMedicineCartItem[];
    createdAt: Date;
    updatedAt: Date;
}

const itemSchema = new Schema<IMedicineCartItem>({
    slug:                 { type: String, required: true },
    name:                 { type: String, required: true },
    mrp:                  { type: Number, required: true },
    offerPrice:           { type: Number, required: true },
    type:                 { type: String, required: true },
    quantity:             { type: Number, default: 1, min: 1, max: 10 },
    thumbnail:            { url: String, publicId: String },
    prescriptionRequired: { type: Boolean, default: false },
    addedAt:              { type: Date, default: Date.now },
}, { _id: false });

const medicineCartSchema = new Schema<MedicineCartDocument>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
        items:  [itemSchema],
    },
    { timestamps: true }
);

const MedicineCart = (mongoose.models.MedicineCart as mongoose.Model<MedicineCartDocument>) ||
    mongoose.model<MedicineCartDocument>('MedicineCart', medicineCartSchema);

export default MedicineCart;

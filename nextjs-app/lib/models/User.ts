import mongoose, { Schema, Document, Model } from 'mongoose';
import validator from 'validator';

export interface AddressDocument {
    _id: mongoose.Types.ObjectId;
    houseNo: string;
    roadName?: string;
    area?: string;
    locality?: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
}

export interface UserDocument extends Document {
    firstName: string;
    lastName: string;
    mobileNumber: string;
    email?: string;
    googleId?: string;
    authProvider: 'local' | 'google';
    address?: string;
    city?: string;
    state?: string;
    addresses: AddressDocument[];
    isVerified: boolean;
    isActive: boolean;
    migrationStatus: 'pending' | 'in_progress' | 'completed' | 'not_required';
    lastMigrationReminder?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserModel extends Model<UserDocument> { }

const addressSchema = new Schema({
    houseNo: { type: String, required: [true, 'House no / building name is required'], trim: true, maxlength: 100 },
    roadName: { type: String, trim: true, maxlength: 100 },
    area: { type: String, trim: true, maxlength: 100 },
    locality: { type: String, trim: true, maxlength: 100 },
    city: { type: String, required: [true, 'City is required'], trim: true, maxlength: 50 },
    state: { type: String, required: [true, 'State is required'], trim: true, maxlength: 50 },
    pincode: {
        type: String,
        required: [true, 'Pincode is required'],
        validate: { validator: (v: string) => /^\d{6}$/.test(v), message: 'Pincode must be 6 digits' }
    },
    isDefault: { type: Boolean, default: false },
}, { _id: true });

const userSchema = new Schema<UserDocument, IUserModel>({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        default: '',
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    mobileNumber: {
        type: String,
        required: [true, "Mobile number is required"],
        unique: true,
        validate: {
            validator: function (v: string) {
                return validator.isMobilePhone(v, "any", { strictMode: false });
            },
            message: "Invalid mobile number",
        },
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        validate: {
            validator: function (v: string) {
                if (!v) return true;
                return validator.isEmail(v);
            },
            message: "Invalid email address",
        },
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local",
    },
    address: {
        type: String,
        trim: true,
        maxlength: [200, 'Address cannot exceed 200 characters']
    },
    city: {
        type: String,
        trim: true,
        maxlength: [50, 'City cannot exceed 50 characters']
    },
    state: {
        type: String,
        trim: true,
        maxlength: [50, 'State cannot exceed 50 characters']
    },
    addresses: { type: [addressSchema], default: [] },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    migrationStatus: {
        type: String,
        enum: ["pending", "in_progress", "completed", "not_required"],
        default: "not_required",
    },
    lastMigrationReminder: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true
});

userSchema.pre("save", async function (this: UserDocument) {
    this.updatedAt = new Date();
});

const User = (mongoose.models.User as IUserModel) || mongoose.model<UserDocument, IUserModel>("User", userSchema);

export default User;

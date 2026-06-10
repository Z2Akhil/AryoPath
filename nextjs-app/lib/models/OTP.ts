import mongoose, { Schema, Document, Model } from 'mongoose';
import validator from 'validator';

export interface OTPDocument extends Document {
    mobileNumber?: string;
    email?: string;
    otp: string;
    verificationId?: string;
    purpose: 'verification' | 'forgot_password' | 'login';
    expiresAt: Date;
    attempts: number;
    isUsed: boolean;
    provider: 'MessageCentral';
    metadata?: any;
    createdAt: Date;
}

export interface IOTPModel extends Model<OTPDocument> { }

const otpSchema = new Schema<OTPDocument, IOTPModel>({
    mobileNumber: {
        type: String,
        validate: {
            validator: function (v: string) {
                if (!v) return true;
                return validator.isMobilePhone(v, "any", { strictMode: false });
            },
            message: "Invalid mobile number",
        },
    },
    email: {
        type: String,
        validate: {
            validator: function (v: string) {
                if (!v) return true;
                return validator.isEmail(v);
            },
            message: "Invalid email address",
        },
    },
    otp: {
        type: String,
        required: true,
    },
    verificationId: {
        type: String,
        sparse: true,
    },
    purpose: {
        type: String,
        enum: ["verification", "forgot_password", "login"],
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    attempts: {
        type: Number,
        default: 0,
    },
    isUsed: {
        type: Boolean,
        default: false,
    },
    provider: {
        type: String,
        enum: ["MessageCentral"],
        default: "MessageCentral",
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {},
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

otpSchema.pre("save", async function (this: OTPDocument) {
    if (!this.mobileNumber && !this.email) {
        throw new Error("Either mobileNumber or email is required");
    }
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ mobileNumber: 1, purpose: 1, isUsed: 1 });
otpSchema.index({ email: 1, purpose: 1, isUsed: 1 });
// verificationId index is defined by backend model to avoid duplicate index warning

const OTP = (mongoose.models.OTP as IOTPModel) || mongoose.model<OTPDocument, IOTPModel>("OTP", otpSchema);

export default OTP;

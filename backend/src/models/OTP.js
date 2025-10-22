import mongoose from "mongoose";
import validator from "validator";

const otpSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return validator.isMobilePhone(v, "any", { strictMode: false });
      },
      message: "Invalid mobile number",
    },
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ["verification", "forgot_password"],
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

otpSchema.index({
  mobileNumber: 1,
  purpose: 1,
  isUsed: 1,
});

export default mongoose.model("OTP", otpSchema);

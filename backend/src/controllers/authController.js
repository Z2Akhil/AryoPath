import User from "../models/User.js";
import OTP from "../models/OTP.js";
import jwt from "jsonwebtoken";
import OTPGenerator, { generateOTP } from "../utils/otpGenerator.js";
import SMSService from "../utils/smsService.js";

class AuthController {
  static async requestOTP(req, res) {
    try {
      const { mobileNumber, purpose = "verification" } = req.body;
      if (!mobileNumber) {
        return res.status(400).json({
          success: false,
          message: "Mobile number is required",
        });
      }

      if (purpose == "verification") {
        const existingUser = await User.findOne({ mobileNumber });
        if (existingUser && existingUser.isVerified) {
          return res.status(400).json({
            success: false,
            message: "Mobile number is already verified",
          });
        }
      }

      const otp = OTPGenerator.generateOTP();
      const expiresAt = OTPGenerator.getExpiryTime();

      await OTP.create({
        mobileNumber,
        otp,
        purpose,
        expiresAt,
      });

      const smsResult = await SMSService.sendOTP(mobileNumber, otp);
      if (!smsResult.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP",
        });
      }

      return res.json({
        success: true,
        message: "OTP sent successfully",
        purpose,
      });
    } catch (err) {
      console.error("OTP request error: ", err);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async verifyOTP(req, res) {
    try {
      const { mobileNumber, otp, purpose = "verification" } = req.body;

      if (!mobileNumber || !otp) {
        return res.status(400).json({
          success: false,
          message: "Mobile number and OTP is required",
        });
      }

      const otpRecord = await OTP.findOne({
        mobileNumber,
        purpose,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP",
        });
      }

      if (otpRecord.attempts >= 3) {
        return res.status(400).json({
          success: false,
          message: "Too many failed attempts. Please request new OTP",
        });
      }

      if (otpRecord.otp != otp) {
        otpRecord.attempts += 1;
        await otpRecord.save();

        return res.status(400).json({
          success: false,
          message: "Invalid OTP",
        });
      }

      otpRecord.isUsed = true;
      await otpRecord.save();

      let user;

      if (purpose === "verification") {
        user = await User.findOneAndUpdate(
          { mobileNumber },
          { isVerified: true },
          { new: true, upsert: true }
        );
      }

      res.json({
        success: true,
        message: "OTP verified successfully",
        user:
          purpose === "verification"
            ? {
                id: user._id,
                mobileNumber: user.mobileNumber,
                isVerified: user.isVerified,
              }
            : undefined,
        purpose,
      });
    } catch (err) {
      console.error("OTP verification error: ", err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async setPassword(req, res) {
    try {
      const { mobileNumber, password } = req.body;

      if (!mobileNumber || !password) {
        return res.status(400).json({
          success: false,
          message: "Mobile number and password is required",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be atleast 6 characters long.",
        });
      }

      const user = await User.findOne({ mobileNumber, isVerified: true });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found or not verified",
        });
      }

      user.password = password;
      await user.save();

      const token = jwt.sign(
        {
          id: user._id,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: "Password set successfully",
        token,
        user: {
          id: user._id,
          mobileNumber: mobileNumber,
          isVerified: user.isVerified,
        },
      });
    } catch (err) {
      console.error("Set password error: ", err);
      res.status(500).json({
        successs: false,
        message: "Internal server error",
      });
    }
  }

  static async login(req, res) {
    try {
      const { mobileNumber, password } = req.body;

      if (!mobileNumber || !password) {
        return res.status(400).json({
          success: false,
          message: "Mobile number and password are required",
        });
      }

      const user = await User.findOne({
        mobileNumber,
        isVerified: true,
      }).select("+password");

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      res.json({
        success: true,
        message: "Login successfully",
        token,
        user: {
          id: user._id,
          mobileNumber: user.mobileNumber,
          isVerified: user.isVerified,
        },
      });
    } catch (err) {
      console.error("Login error: ", err);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Forgot password - request OTP
  static async forgotPassword(req, res) {
    try {
      const { mobileNumber } = req.body;

      if (!mobileNumber) {
        return res.status(400).json({
          success: false,
          message: "Mobile number is required",
        });
      }

      const user = await User.findOne({ mobileNumber, isVerified: true });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Generate OTP for password reset
      const otp = OTPGenerator.generateOTP();
      const expiresAt = OTPGenerator.getExpiryTime();

      await OTP.create({
        mobileNumber,
        otp,
        purpose: "forgot_password",
        expiresAt,
      });

      // Send OTP via SMS
      const smsResult = await SMSService.sendOTP(mobileNumber, otp);

      if (!smsResult.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP",
        });
      }

      res.json({
        success: true,
        message: "OTP sent for password reset",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Reset password with OTP
  static async resetPassword(req, res) {
    try {
      const { mobileNumber, otp, newPassword } = req.body;

      if (!mobileNumber || !otp || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Mobile number, OTP and new password are required",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      // Verify OTP first
      const otpRecord = await OTP.findOne({
        mobileNumber,
        purpose: "forgot_password",
        isUsed: false,
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      if (!otpRecord || otpRecord.otp !== otp) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP",
        });
      }

      const user = await User.findOne({ mobileNumber, isVerified: true });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Mark OTP as used
      otpRecord.isUsed = true;
      await otpRecord.save();

      res.json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async register(req, res) {
    try {
      const { firstName, lastName, mobileNumber, password, otp } = req.body;

      if (!firstName || !lastName || !mobileNumber || !password || !otp) {
        return res.status(400).json({
          success: false,
          message: "All fields are required (firstName, lastName, mobileNumber, password, otp)",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      // Verify OTP first
      const otpRecord = await OTP.findOne({
        mobileNumber,
        purpose: "verification",
        isUsed: false,
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP",
        });
      }

      if (otpRecord.attempts >= 3) {
        return res.status(400).json({
          success: false,
          message: "Too many failed attempts. Please request new OTP",
        });
      }

      if (otpRecord.otp != otp) {
        otpRecord.attempts += 1;
        await otpRecord.save();

        return res.status(400).json({
          success: false,
          message: "Invalid OTP",
        });
      }

      // Check if user already exists and is verified
      const existingUser = await User.findOne({ mobileNumber });
      if (existingUser && existingUser.isVerified) {
        return res.status(400).json({
          success: false,
          message: "User with this mobile number already exists.",
        });
      }

      // Mark OTP as used
      otpRecord.isUsed = true;
      await otpRecord.save();

      // Create or update user
      let user;
      if (existingUser) {
        // Update existing unverified user
        user = await User.findOneAndUpdate(
          { mobileNumber },
          {
            firstName,
            lastName,
            password,
            isVerified: true,
            updatedAt: Date.now()
          },
          { new: true }
        );
      } else {
        // Create new user
        user = await User.create({
          firstName,
          lastName,
          mobileNumber,
          password,
          isVerified: true,
        });
      }

      const token = jwt.sign(
        {
          id: user._id,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: "Registration successful",
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          mobileNumber: user.mobileNumber,
          isVerified: user.isVerified,
        },
      });
    } catch (err) {
      console.error("Registration error: ", err);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      res.json({
        success: true,
        user: {
          id: req.user._id,
          mobileNumber: req.user.mobileNumber,
          isVerified: req.user.isVerified,
          createdAt: req.user.createdAt,
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}

export default AuthController;

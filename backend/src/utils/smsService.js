import axios from "axios";
import validator from "validator";
import SMSHistory from "../models/SMSHistory.js";

class SMSService {
  static async sendOTP(mobileNumber, otp, options = {}) {
    let smsRecord = null;
    try {
      // Validate inputs
      if (!this.isValidMobileNumber(mobileNumber)) {
        return { 
          success: false, 
          message: "Invalid mobile number format" 
        };
      }

      if (!otp || otp.length < 4 || otp.length > 8) {
        return { 
          success: false, 
          message: "Invalid OTP format" 
        };
      }

      // Validate environment variables
      if (!this.validateEnvironment()) {
        return { 
          success: false, 
          message: "SMS service configuration error" 
        };
      }

      // Create SMS history record
      smsRecord = await SMSHistory.createRecord({
        mobileNumber,
        messageType: "otp",
        message: `OTP: ${otp} for verification`,
        otp: otp,
        purpose: options.purpose || "verification",
        status: "pending",
        retryCount: 0,
      });

      // Add retry logic
      const maxRetries = options.maxRetries || 3;
      const retryDelay = options.retryDelay || 1000;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // Use GET method with query parameters as per Fast2SMS documentation
          const response = await axios.get(
            process.env.FAST2SMS_API_URL,
            {
              params: {
                authorization: process.env.FAST2SMS_API_KEY,
                variables_values: otp,
                route: "otp",
                numbers: mobileNumber,
                flash: 1,
              },
              timeout: 10000, // 10 second timeout
            }
          );

          if (response.status === 200 && response.data?.return === true) {
            console.log(`✅ OTP sent successfully to ${mobileNumber}`);
            
            // Update SMS history with success
            await SMSHistory.updateStatus(
              smsRecord._id.toString(),
              "sent",
              response.data,
              null
            );
            
            return { 
              success: true, 
              message: "OTP sent successfully",
              requestId: response.data?.request_id 
            };
          } else {
            throw new Error(`API returned error: ${response.data?.message || 'Unknown error'}`);
          }
        } catch (error) {
          console.warn(`⚠️ SMS send attempt ${attempt} failed:`, error.message);
          
          // Update retry count
          smsRecord.retryCount = attempt;
          await smsRecord.save();
          
          if (attempt === maxRetries) {
            throw error;
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => 
            setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1))
          );
        }
      }
    } catch (error) {
      console.error("❌ SMS sending failed after all retries:", {
        mobileNumber,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      // Update SMS history with failure
      if (smsRecord) {
        await SMSHistory.updateStatus(
          smsRecord._id.toString(),
          "failed",
          null,
          error.message
        );
      }
      
      return { 
        success: false, 
        message: "Failed to send OTP after multiple attempts",
        error: error.message 
      };
    }
  }

  static async sendNotification(mobileNumber, message, options = {}) {
    let smsRecord = null;
    try {
      if (!this.isValidMobileNumber(mobileNumber)) {
        return { 
          success: false, 
          message: "Invalid mobile number format" 
        };
      }

      if (!message || message.trim().length === 0) {
        return { 
          success: false, 
          message: "Message cannot be empty" 
        };
      }

      if (!this.validateEnvironment()) {
        return { 
          success: false, 
          message: "SMS service configuration error" 
        };
      }

      // Create SMS history record
      smsRecord = await SMSHistory.createRecord({
        mobileNumber,
        messageType: "notification",
        message: message.trim(),
        purpose: options.purpose || "notification",
        status: "pending",
        retryCount: 0,
      });

      // Use GET method with query parameters as per Fast2SMS documentation
      const response = await axios.get(
        process.env.FAST2SMS_API_URL,
        {
          params: {
            authorization: process.env.FAST2SMS_API_KEY,
            message: message.trim(),
            route: "q",
            numbers: mobileNumber,
            flash: options.flash || 0,
            language: "english",
          },
          timeout: 10000,
        }
      );

      if (response.status === 200 && response.data?.return === true) {
        console.log(`✅ Notification sent successfully to ${mobileNumber}`);
        
        // Update SMS history with success
        await SMSHistory.updateStatus(
          smsRecord._id.toString(),
          "sent",
          response.data,
          null
        );
        
        return { 
          success: true, 
          message: "Notification sent successfully",
          requestId: response.data?.request_id 
        };
      } else {
        throw new Error(`API returned error: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("❌ Notification sending failed:", {
        mobileNumber,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      // Update SMS history with failure
      if (smsRecord) {
        await SMSHistory.updateStatus(
          smsRecord._id.toString(),
          "failed",
          null,
          error.message
        );
      }
      
      return { 
        success: false, 
        message: "Failed to send notification",
        error: error.message 
      };
    }
  }

  // Helper methods
  static isValidMobileNumber(mobileNumber) {
    if (!mobileNumber) return false;
    
    // Remove any non-digit characters
    const cleanNumber = mobileNumber.toString().replace(/\D/g, '');
    
    // Check if it's a valid Indian mobile number (10 digits starting with 6-9)
    return validator.isMobilePhone(cleanNumber, 'en-IN') && cleanNumber.length === 10;
  }

  static validateEnvironment() {
    const requiredEnvVars = ['FAST2SMS_API_URL', 'FAST2SMS_API_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error(`❌ Missing environment variables: ${missingVars.join(', ')}`);
      return false;
    }
    
    return true;
  }

  // Mock mode for development/testing
  static async sendOTPMock(mobileNumber, otp) {
    console.log(`📱 [MOCK] OTP ${otp} would be sent to ${mobileNumber}`);
    return { 
      success: true, 
      message: "OTP sent successfully (mock mode)",
      mock: true 
    };
  }

  static async sendNotificationMock(mobileNumber, message) {
    console.log(`📱 [MOCK] Notification "${message}" would be sent to ${mobileNumber}`);
    return { 
      success: true, 
      message: "Notification sent successfully (mock mode)",
      mock: true 
    };
  }
}

export default SMSService;

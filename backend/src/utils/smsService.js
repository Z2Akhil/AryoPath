class SMSService {
  static async sendOTP(mobileNumber, otp) {
    try {
      // to be integrated third party service
      console.log(`sending OTP ${otp} to ${mobileNumber}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return { success: true, message: "OTP sent successfully" };
    } catch (err) {
      console.log("SMS sending error: ", err);
      return { success: false, message: "Failed to send OTP" };
    }
  }
}

export default SMSService;

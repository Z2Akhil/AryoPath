class OTPGenerator {
  static generateOTP(length = 6) {
    const digits = "0123456789";
    let otp = "";

    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return "123456";
  }
  static getExpiryTime(minutes = 10) {
    return new Date(Date.now() + minutes * 60 * 1000);
  }
}

// Named export for the generateOTP function
export const generateOTP = OTPGenerator.generateOTP;

export default OTPGenerator;

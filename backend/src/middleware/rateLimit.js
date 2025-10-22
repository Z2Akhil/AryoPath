import rateLimit from "express-rate-limit";

const otpRateLimit = rateLimit({
  windowMs: parseInt(process.env.OTP_RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
  max: parseInt(process.env.OTP_RATE_LIMIT_MAX) || 3,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export {
  otpRateLimit,
  apiRateLimit,
};

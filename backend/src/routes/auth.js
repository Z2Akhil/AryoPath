import express from "express";
import AuthController from "../controllers/authController.js";
import { otpRateLimit, apiRateLimit } from "../middleware/rateLimit.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use(apiRateLimit);

router.post("/request-otp", otpRateLimit, AuthController.requestOTP);
router.post("/verify-otp", AuthController.verifyOTP);
router.post("/register", AuthController.register);
router.post("/set-password", AuthController.setPassword);
router.post("/login", AuthController.login);
router.post("/forgot-password", otpRateLimit, AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);

router.get("/profile", auth, AuthController.getProfile);

export default router;

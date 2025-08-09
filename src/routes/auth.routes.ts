import express from "express";
import * as authController from "../controllers/auth.controller";
import { otpRateLimiter, authRateLimiter } from "../middlewares/rateLimiter.middleware";

const router = express.Router();

//login, resgister & verification
router.post("/register", authController.register);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-otp", otpRateLimiter, authController.resendOtpController); 
router.post("/login", authController.login);

// forgot/reset
router.post("/forgot-password", otpRateLimiter, authController.forgotPasswordController);
router.post("/reset-password", otpRateLimiter, authController.resetPasswordController);

//logout & refresh 
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logoutController);

export default router;

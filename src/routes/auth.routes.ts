import express from "express";
import * as authController from "../controllers/auth.controller";

const router = express.Router();

router.post("/register", authController.register);
router.post("/verify-email", authController.verifyEmail);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logoutController);

export default router;

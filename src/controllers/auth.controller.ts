import { Request, Response } from "express";
import * as authService from "../services/auth.service";

export const register = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const result = await authService.registerUser(payload);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    await authService.verifyEmailOTP(email, otp);
    res.json({ success: true, message: "Email verified" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await authService.loginUser(
      email,
      password
    );

    // set httpOnly cookie for refresh token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.json({ success: true, accessToken, user });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    // try cookie first, fallback to body
    const oldRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!oldRefreshToken) throw new Error("No refresh token provided");

    const tokens = await authService.refreshTokens(oldRefreshToken);

    // set new cookie
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, accessToken: tokens.accessToken });
  } catch (err: any) {
    res.status(401).json({ success: false, message: err.message });
  }
};

export const logoutController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub;
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    await authService.logout(userId, refreshToken);
    res.clearCookie("refreshToken");
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

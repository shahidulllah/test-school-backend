import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

export const authGuard = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token) as any;
    // attach user info to request
    (req as any).user = decoded;
    next();
  } catch (err: any) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};

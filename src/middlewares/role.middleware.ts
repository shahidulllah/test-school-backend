import { Request, Response, NextFunction } from "express";

export const roleGuard = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  };
};

export type UserRole = "admin" | "student" | "supervisor";

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isVerified: boolean;
  refreshTokens?: string[];
  otp?: {
    code: string;
    expiresAt: Date;
    purpose: "email_verification" | "password_reset" | "login";
  } | null;
  createdAt?: Date;
  updatedAt?: Date;
  highestLevel?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null;
  certificates?: { level: string; issuedAt: Date; certificateUrl?: string }[];
}

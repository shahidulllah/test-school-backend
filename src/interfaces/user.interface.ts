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
}

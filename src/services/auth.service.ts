import { generateOTP, otpExpiryDate } from "../utils/otp";
import { signAccessToken, signRefreshToken } from "../utils/jwt";
import { sendMail } from "../utils/mailer";
import UserModel from "../models/user.model";

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: "admin" | "student" | "supervisor";
}

export const registerUser = async (payload: RegisterPayload) => {
  const existing = await UserModel.findOne({ email: payload.email });
  if (existing) throw new Error("Email already in use");

  const user = new UserModel({
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: payload.role || "student",
  });

  // create OTP for email verification
  const code = generateOTP();
  user.otp = {
    code,
    expiresAt: otpExpiryDate(15),
    purpose: "email_verification",
  };

  await user.save();

  // send OTP email (fire and forget)
  await sendMail(user.email, "Verify your email", `Your OTP: ${code}`);

  return { id: user._id, email: user.email, name: user.name };
};

export const verifyEmailOTP = async (email: string, otp: string) => {
  const user = await UserModel.findOne({ email });
  if (!user) throw new Error("User not found");
  if (!user.otp || user.otp.purpose !== "email_verification")
    throw new Error("No OTP found");
  if (user.otp.expiresAt < new Date()) throw new Error("OTP expired");
  if (user.otp.code !== otp) throw new Error("Invalid OTP");

  user.isVerified = true;
  user.otp = null;
  await user.save();

  return { message: "Verified" };
};

export const loginUser = async (email: string, password: string) => {
  const user = await UserModel.findOne({ email });
  if (!user) throw new Error("Invalid credentials");
  const matched = await user.comparePassword(password);
  if (!matched) throw new Error("Invalid credentials");
  if (!user.isVerified) throw new Error("Email not verified");

  const accessToken = signAccessToken({ sub: user._id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user._id, role: user.role });

  // store refresh token in DB
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push(refreshToken);
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

export const refreshTokens = async (oldRefreshToken: string) => {
  // verify and find user
  const decoded: any = await (
    await import("../utils/jwt")
  ).verifyRefreshToken(oldRefreshToken);
  const user = await UserModel.findById(decoded.sub);
  if (!user) throw new Error("User not found");

  // check token exists in DB
  if (!user.refreshTokens?.includes(oldRefreshToken)) {
    throw new Error("Refresh token revoked");
  }

  // issue new tokens
  const newAccess = signAccessToken({ sub: user._id, role: user.role });
  const newRefresh = signRefreshToken({ sub: user._id, role: user.role });

  // replace refresh token in DB: remove old, add new
  user.refreshTokens = user.refreshTokens.filter((t) => t !== oldRefreshToken);
  user.refreshTokens.push(newRefresh);
  await user.save();

  return { accessToken: newAccess, refreshToken: newRefresh };
};

export const logout = async (userId: string, refreshToken?: string) => {
  const user = await UserModel.findById(userId);
  if (!user) return;
  if (!refreshToken) {
    user.refreshTokens = [];
  } else {
    if (user.refreshTokens) {
      user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    }
  }
  await user.save();
  return;
};

//=====================================
/**
 * Resend OTP for a user for a given purpose (email_verification | password_reset)
 */
export const resendOTP = async (
  email: string,
  purpose: "email_verification" | "password_reset"
) => {
  const user = await UserModel.findOne({ email });
  if (!user) throw new Error("User not found");

  // if user already verified and trying to resend email verification
  if (purpose === "email_verification" && user.isVerified) {
    throw new Error("Email already verified");
  }

  const code = generateOTP();
  user.otp = { code, expiresAt: otpExpiryDate(15), purpose };
  await user.save();

  await sendMail(
    user.email,
    `Your ${
      purpose === "email_verification" ? "verification" : "password reset"
    } OTP`,
    `OTP: ${code}`
  );

  return { message: "OTP sent" };
};

/**
 * Forgot password: generate OTP for password reset
 */
export const forgotPassword = async (email: string) => {
  const user = await UserModel.findOne({ email });
  if (!user) throw new Error("User not found");

  const code = generateOTP();
  user.otp = { code, expiresAt: otpExpiryDate(15), purpose: "password_reset" };
  await user.save();

  await sendMail(
    user.email,
    "Password reset OTP",
    `Your password reset OTP: ${code}`
  );

  return { message: "Password reset OTP sent" };
};

/**
 * Reset password using OTP
 */
export const resetPasswordWithOTP = async (
  email: string,
  otp: string,
  newPassword: string
) => {
  const user = await UserModel.findOne({ email });
  if (!user) throw new Error("User not found");
  if (!user.otp || user.otp.purpose !== "password_reset")
    throw new Error("No password reset request found");
  if (user.otp.expiresAt < new Date()) throw new Error("OTP expired");
  if (user.otp.code !== otp) throw new Error("Invalid OTP");

  user.password = newPassword; // pre-save hook will hash
  user.otp = null;
  await user.save();

  // Optionally notify user about password change
  await sendMail(
    user.email,
    "Password changed",
    "Your password has been successfully changed."
  );

  return { message: "Password reset successful" };
};

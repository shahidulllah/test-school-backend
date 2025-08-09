import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";

export const signAccessToken = (payload: object) => {
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn } as jwt.SignOptions);
};

export const signRefreshToken = (payload: object) => {
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || "30d";
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, ACCESS_SECRET) as any;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, REFRESH_SECRET) as any;

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_ACCESS_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_ACCESS_SECRET is not configured");
}

export interface JwtPayload {
  id: number;
  email: string;
  role: "USER" | "ADMIN";
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "1h",
  });
};
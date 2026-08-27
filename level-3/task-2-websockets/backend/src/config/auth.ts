
import jwt from "jsonwebtoken";

export type AuthTokenPayload = {
  userId: number;
};

const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ||
  "codveda_task2_access_secret_2026";

export const generateAccessToken = (
  userId: number
): string => {
  return jwt.sign(
    { userId },
    JWT_ACCESS_SECRET,
    {
      expiresIn: "1d",
    }
  );
};

export const verifyAccessToken = (
  token: string
): AuthTokenPayload => {
  return jwt.verify(
    token,
    JWT_ACCESS_SECRET
  ) as AuthTokenPayload;
};


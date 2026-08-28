import jwt from "jsonwebtoken";

import {
  getUserById,
} from "../services/user.service.js";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

type JwtPayload = {
  userId: number;
};

export const getAuthUser = async (
  authorization?: string
): Promise<AuthUser | null> => {
  if (!authorization) {
    console.log(
      "Authorization header: NO TOKEN"
    );

    return null;
  }

  console.log(
    "Authorization header: TOKEN RECEIVED"
  );

  if (
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    console.log(
      "Invalid Authorization header format"
    );

    return null;
  }

  const token =
    authorization.substring(7);

  if (!token) {
    console.log(
      "Bearer token is empty"
    );

    return null;
  }

  /*
   * IMPORTANT:
   * This must be the SAME secret used
   * when loginUser() creates the JWT.
   */
  const JWT_ACCESS_SECRET =
    process.env.JWT_ACCESS_SECRET ||
    "codveda_graphql_access_secret_2026";

  try {
    const decoded =
      jwt.verify(
        token,
        JWT_ACCESS_SECRET
      ) as JwtPayload;

    /*
     * loginUser() creates the JWT with:
     *
     * {
     *   userId: user.id
     * }
     */
    if (
      !decoded.userId ||
      !Number.isInteger(
        Number(decoded.userId)
      )
    ) {
      console.log(
        "JWT does not contain a valid userId"
      );

      return null;
    }

    /*
     * Get the actual user from PostgreSQL.
     */
    const user =
      await getUserById(
        Number(decoded.userId)
      );

    if (!user) {
      console.log(
        "Authenticated user not found in database"
      );

      return null;
    }

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    console.log(
      "Authenticated user:",
      authUser
    );

    return authUser;
  } catch (error) {
    console.log(
      "JWT verification failed:",
      error
    );

    return null;
  }
};
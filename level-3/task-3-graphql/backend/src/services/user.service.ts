import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { pool } from "../config/database.js";

export type User = {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

type UserWithPassword = User & {
  passwordHash: string;
};

const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ||
  "codveda_graphql_access_secret_2026";

export const getUsers = async (): Promise<User[]> => {
  const result = await pool.query<User>(
    `
      SELECT
        id,
        name,
        email,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM users
      ORDER BY id ASC
    `
  );

  return result.rows;
};

export const getUserById = async (
  id: number
): Promise<User | null> => {
  const result = await pool.query<User>(
    `
      SELECT
        id,
        name,
        email,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  return result.rows[0] ?? null;
};

export const getUserByEmail = async (
  email: string
): Promise<UserWithPassword | null> => {
  const result =
    await pool.query<UserWithPassword>(
      `
        SELECT
          id,
          name,
          email,
          password_hash AS "passwordHash",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM users
        WHERE email = $1
        LIMIT 1
      `,
      [email]
    );

  return result.rows[0] ?? null;
};

export const createUser = async (
  name: string,
  email: string,
  password: string
): Promise<User> => {
  const passwordHash =
    await bcrypt.hash(password, 10);

  const result = await pool.query<User>(
    `
      INSERT INTO users (
        name,
        email,
        password_hash
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        name,
        email,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [
      name,
      email,
      passwordHash,
    ]
  );

  return result.rows[0];
};

export const loginUser = async (
  email: string,
  password: string
) => {
  const user =
    await getUserByEmail(email);

  if (!user) {
    return null;
  }

  const passwordMatches =
    await bcrypt.compare(
      password,
      user.passwordHash
    );

  if (!passwordMatches) {
    return null;
  }

  const accessToken =
    jwt.sign(
      {
        userId: user.id,
      },
      JWT_ACCESS_SECRET,
      {
        expiresIn: "1h",
      }
    );

  const {
    passwordHash: _passwordHash,
    ...safeUser
  } = user;

  return {
    user: safeUser,
    accessToken,
  };
};
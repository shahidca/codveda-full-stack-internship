
import bcrypt from "bcrypt";
import { pool } from "../config/database.js";
import { generateAccessToken } from "../config/auth.js";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

export type AuthResult = {
  user: AuthUser;
  accessToken: string;
};

export const registerUser = async (
  input: RegisterInput
): Promise<AuthResult> => {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!name || !email || !password) {
    throw new Error("Name, email and password are required");
  }

  if (password.length < 6) {
    throw new Error(
      "Password must be at least 6 characters"
    );
  }

  const existingUser = await pool.query(
    `
      SELECT id
      FROM users
      WHERE email = $1
    `,
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error("Email is already registered");
  }

  const passwordHash = await bcrypt.hash(
    password,
    10
  );

  const result = await pool.query<AuthUser>(
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
        email
    `,
    [name, email, passwordHash]
  );

  const user = result.rows[0];

  const accessToken = generateAccessToken(
    user.id
  );

  return {
    user,
    accessToken,
  };
};

export const loginUser = async (
  input: LoginInput
): Promise<AuthResult> => {
  const email = input.email.trim().toLowerCase();

  const result = await pool.query<
    AuthUser & { passwordHash: string }
  >(
    `
      SELECT
        id,
        name,
        email,
        password_hash AS "passwordHash"
      FROM users
      WHERE email = $1
    `,
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error("Invalid email or password");
  }

  const user = result.rows[0];

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }

  const authUser: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
  };

  const accessToken = generateAccessToken(
    user.id
  );

  return {
    user: authUser,
    accessToken,
  };
};


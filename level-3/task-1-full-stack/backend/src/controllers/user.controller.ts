import { Request, Response } from "express";
import bcrypt from "bcrypt";

import { pool } from "../config/database";
import { registerUserSchema } from "../schemas/user.schema";

export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = registerUserSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, email, password } = result.data;

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await pool.query(
      `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at
      `,
      [name, email, passwordHash, "USER"]
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: newUser.rows[0],
    });
  } catch (error) {
    console.error("Register user error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
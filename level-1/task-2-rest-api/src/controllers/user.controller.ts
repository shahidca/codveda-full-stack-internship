import { Request, Response } from "express";
import pool from "../config/database.js";

// getUsers 
export const getUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await pool.query(
      "SELECT * FROM users ORDER BY id ASC"
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// createUsers
export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, age } = req.body;

    // Basic validation
    if (!name || !email) {
      res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
      return;
    }

    const result = await pool.query(
      `
      INSERT INTO users (name, email, age)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [name, email, age ?? null]
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error("Create user error:", error);

    // PostgreSQL unique constraint
    if (error.code === "23505") {
      res.status(409).json({
        success: false,
        message: "Email already exists",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

// getUserById
export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const userId = Number(id);

    // Validate ID
    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
      return;
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [userId]
    );

    // User not found
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get user by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

// updateUser
export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = Number(id);

    // Validate ID
    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
      return;
    }

    const { name, email, age } = req.body;

    // Validate request body
    if (!name || !email) {
      res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
      return;
    }

    // Check whether the user exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE id = $1",
      [userId]
    );

    if (existingUser.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Update user
    const result = await pool.query(
      `
      UPDATE users
      SET
        name = $1,
        email = $2,
        age = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
      `,
      [name, email, age ?? null, userId]
    );

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error("Update user error:", error);

    // Duplicate email
    if (error.code === "23505") {
      res.status(409).json({
        success: false,
        message: "Email already exists",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

// deleteUser
export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = Number(id);

    // Validate ID
    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
      return;
    }

    // Delete user
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [userId]
    );

    // User not found
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Delete user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};
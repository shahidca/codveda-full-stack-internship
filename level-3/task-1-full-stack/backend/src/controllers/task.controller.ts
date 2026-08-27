import { Request, Response } from "express";
import { pool } from "../config/database";



export const createTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { title, description, status } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      res.status(400).json({
        success: false,
        message: "Task title is required",
      });
      return;
    }

    const taskStatus = status || "PENDING";

    const validStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED"];

    if (!validStatuses.includes(taskStatus)) {
      res.status(400).json({
        success: false,
        message: "Invalid task status",
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const result = await pool.query(
      `
      INSERT INTO tasks (user_id, title, description, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, title, description, status, created_at, updated_at
      `,
      [
        req.user.id,
        title.trim(),
        description?.trim() || null,
        taskStatus,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create task error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getMyTasks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const result = await pool.query(
      `
      SELECT
        id,
        user_id,
        title,
        description,
        status,
        created_at,
        updated_at
      FROM tasks
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get tasks error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getTaskById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId)) {
      res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
      return;
    }

    const result = await pool.query(
      `
      SELECT
        id,
        user_id,
        title,
        description,
        status,
        created_at,
        updated_at
      FROM tasks
      WHERE id = $1 AND user_id = $2
      `,
      [taskId, req.user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Task not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get task error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId)) {
      res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
      return;
    }

    const { title, description, status } = req.body;

    const validStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED"];

    if (status && !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid task status",
      });
      return;
    }

    const result = await pool.query(
      `
      UPDATE tasks
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND user_id = $5
      RETURNING id, user_id, title, description, status, created_at, updated_at
      `,
      [
        title?.trim() || null,
        description?.trim() || null,
        status || null,
        taskId,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Task not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update task error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId)) {
      res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
      return;
    }

    const result = await pool.query(
      `
      DELETE FROM tasks
      WHERE id = $1 AND user_id = $2
      RETURNING id
      `,
      [taskId, req.user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Task not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
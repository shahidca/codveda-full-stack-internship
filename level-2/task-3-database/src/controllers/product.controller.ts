import { Request, Response } from "express";
import pool from "../config/database.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../schemas/product.schema.js";

/**
 * Create Product
 * POST /api/products
 */
export const createProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validate request body
    const validation = createProductSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const {
      name,
      description,
      price,
      stock,
      category,
    } = validation.data;

    const result = await pool.query(
      `
      INSERT INTO products
        (name, description, price, stock, category)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING
        id,
        name,
        description,
        price,
        stock,
        category,
        created_at,
        updated_at
      `,
      [
        name,
        description ?? null,
        price,
        stock,
        category,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create product error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Get All Products
 * GET /api/products
 */
export const getProducts = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        price,
        stock,
        category,
        created_at,
        updated_at
      FROM products
      ORDER BY id DESC
      `
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get products error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Get Single Product
 * GET /api/products/:id
 */
export const getProductById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        price,
        stock,
        category,
        created_at,
        updated_at
      FROM products
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get product by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Update Product
 * PUT /api/products/:id
 */
export const updateProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    // Validate request body
    const validation = updateProductSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const data = validation.data;

    // Make sure at least one field is supplied
    if (Object.keys(data).length === 0) {
      res.status(400).json({
        success: false,
        message: "At least one field is required for update",
      });
      return;
    }

    // Check whether product exists
    const existingProduct = await pool.query(
      `SELECT id FROM products WHERE id = $1`,
      [id]
    );

    if (existingProduct.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      fields.push(`name = $${values.length + 1}`);
      values.push(data.name);
    }

    if (data.description !== undefined) {
      fields.push(`description = $${values.length + 1}`);
      values.push(data.description);
    }

    if (data.price !== undefined) {
      fields.push(`price = $${values.length + 1}`);
      values.push(data.price);
    }

    if (data.stock !== undefined) {
      fields.push(`stock = $${values.length + 1}`);
      values.push(data.stock);
    }

    if (data.category !== undefined) {
      fields.push(`category = $${values.length + 1}`);
      values.push(data.category);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(id);

    const result = await pool.query(
      `
      UPDATE products
      SET ${fields.join(", ")}
      WHERE id = $${values.length}
      RETURNING
        id,
        name,
        description,
        price,
        stock,
        category,
        created_at,
        updated_at
      `,
      values
    );

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update product error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Delete Product
 * DELETE /api/products/:id
 */
export const deleteProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const result = await pool.query(
      `
      DELETE FROM products
      WHERE id = $1
      RETURNING id, name
      `,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Delete product error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
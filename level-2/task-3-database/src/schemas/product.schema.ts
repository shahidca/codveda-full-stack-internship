import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(150, "Product name must not exceed 150 characters"),

  description: z
    .string()
    .trim()
    .max(1000, "Description must not exceed 1000 characters")
    .optional(),

  price: z
    .number()
    .nonnegative("Price cannot be negative"),

  stock: z
    .number()
    .int("Stock must be an integer")
    .nonnegative("Stock cannot be negative"),

  category: z
    .string()
    .trim()
    .min(2, "Category is required")
    .max(100, "Category must not exceed 100 characters"),
});

export const updateProductSchema = createProductSchema.partial();
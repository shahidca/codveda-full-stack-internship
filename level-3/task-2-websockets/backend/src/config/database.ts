import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured");
}

export const pool = new Pool({
  connectionString: databaseUrl,
});

pool.on("error", (error) => {
  console.error(
    "Unexpected PostgreSQL pool error:",
    error
  );
});

export const testDatabaseConnection =
  async (): Promise<void> => {
    const client = await pool.connect();

    try {
      await client.query("SELECT 1");

      console.log(
        "PostgreSQL connected successfully"
      );
    } finally {
      client.release();
    }
  };
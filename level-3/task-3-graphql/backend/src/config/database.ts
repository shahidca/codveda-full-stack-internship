import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not defined in the environment."
  );
}

export const pool = new Pool({
  connectionString: databaseUrl,
});

pool.on("connect", () => {
  console.log(
    "PostgreSQL connected successfully"
  );
});

pool.on("error", (error) => {
  console.error(
    "Unexpected PostgreSQL pool error:",
    error
  );
});
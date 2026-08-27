import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes";
import { testDatabaseConnection } from "./config/database";
import authRoutes from "./routes/auth.routes";
import taskRoutes from "./routes/task.routes";

const app = express();

const PORT = Number(process.env.PORT) || 4003;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "TaskFlow API is running",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "TaskFlow API is healthy",
  });
});



const startServer = async (): Promise<void> => {
  try {
    await testDatabaseConnection();

    app.listen(PORT, () => {
      console.log(`TaskFlow API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
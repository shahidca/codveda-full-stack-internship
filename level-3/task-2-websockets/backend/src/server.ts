
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import { registerSocketHandlers } from "./socket/socket.js";
import { testDatabaseConnection } from "./config/database.js";

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

const PORT = Number(process.env.PORT) || 4004;

const frontendUrl =
  process.env.FRONTEND_URL || "http://localhost:5173";

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);

app.use(express.json());
app.use("/api/auth", authRoutes);

// --------------------------------------------------
// Socket.io
// --------------------------------------------------

const io = new Server(httpServer, {
  cors: {
    origin: frontendUrl,
    credentials: true,
  },
});

// --------------------------------------------------
// REST API
// --------------------------------------------------

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "TaskFlow WebSocket API is running",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "WebSocket server is healthy",
  });
});

// --------------------------------------------------
// Register Socket.io event handlers
// --------------------------------------------------

registerSocketHandlers(io);

// --------------------------------------------------
// Start Server
// --------------------------------------------------

const startServer = async (): Promise<void> => {
  try {
    // Test PostgreSQL connection before starting server
    await testDatabaseConnection();

    httpServer.listen(PORT, () => {
      console.log(
        `WebSocket server running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);

    process.exit(1);
  }
};

startServer();


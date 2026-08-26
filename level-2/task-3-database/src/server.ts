import express from "express";
import cors from "cors";

import productRoutes from "./routes/product.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Level 2 Task 3 Database API is running",
  });
});

app.use("/api/products", productRoutes);

const PORT = Number(process.env.PORT) || 4002;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
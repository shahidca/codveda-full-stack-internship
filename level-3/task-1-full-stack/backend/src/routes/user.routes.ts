import { Router } from "express";

import { registerUser } from "../controllers/user.controller";
import {
  authenticate,
  authorizeRoles,
} from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", registerUser);

router.get("/me", authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Protected route accessed successfully",
    data: {
      user: req.user,
    },
  });
});

router.get(
  "/admin",
  authenticate,
  authorizeRoles("ADMIN"),
  (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Admin-only route accessed successfully",
    });
  }
);

export default router;
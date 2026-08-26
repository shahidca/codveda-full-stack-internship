import { Router } from "express";
import {
  authenticateToken,
  type AuthenticatedRequest,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.get(
  "/profile",
  authenticateToken,
  (req: AuthenticatedRequest, res) => {
    res.status(200).json({
      success: true,
      message: "You accessed a protected route",
      user: req.user,
    });
  }
);

export default router;
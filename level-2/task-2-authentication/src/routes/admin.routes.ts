import { Router } from "express";
import {
  authenticateToken,
  type AuthenticatedRequest,
} from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.get(
  "/dashboard",
  authenticateToken,
  authorizeRoles("admin"),
  (req: AuthenticatedRequest, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome to the admin dashboard",
      user: req.user,
    });
  }
);

export default router;
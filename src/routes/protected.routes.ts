import express from "express";
import { authGuard } from "../middlewares/auth.middleware";
import { roleGuard } from "../middlewares/role.middleware";

const router = express.Router();

router.get("/student-only", authGuard, roleGuard(["student"]), (_req, res) => {
  res.json({ success: true, message: "Welcome student" });
});

export default router;

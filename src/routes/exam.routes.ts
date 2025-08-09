import express from "express";
import * as examCtrl from "../controllers/exam.controller";
import { authGuard } from "../middlewares/auth.middleware";
import { roleGuard } from "../middlewares/role.middleware";

const router = express.Router();

// student starts test for a step
router.post(
  "/start/:step",
  authGuard,
  roleGuard(["student"]),
  examCtrl.startTest
);

// submit answers
router.post("/submit", authGuard, roleGuard(["student"]), examCtrl.submitTest);

// get test result by id
router.get("/result/:id", authGuard, examCtrl.getTestResult);

export default router;

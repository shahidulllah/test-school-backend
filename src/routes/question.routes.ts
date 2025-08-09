import express from "express";
import * as qCtrl from "../controllers/question.controller";
import { authGuard } from "../middlewares/auth.middleware";
import { roleGuard } from "../middlewares/role.middleware";

const router = express.Router();

router.get(
  "/",
  authGuard,
  roleGuard(["admin", "supervisor"]),
  qCtrl.listQuestions
);
router.post("/", authGuard, roleGuard(["admin"]), qCtrl.createQuestion);
router.patch("/:id", authGuard, roleGuard(["admin"]), qCtrl.updateQuestion);
router.delete("/:id", authGuard, roleGuard(["admin"]), qCtrl.deleteQuestion);

export default router;

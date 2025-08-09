import { Request, Response, NextFunction } from "express";
import * as examService from "../services/exam.service";

export const startTest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.sub;
    const step = Number(req.params.step) as 1 | 2 | 3;
    const { testId, questions, durationSeconds, totalMarks } =
      await examService.startTest(userId, step, req.ip);
    res.json({
      success: true,
      data: { testId, questions, durationSeconds, totalMarks },
    });
  } catch (err) {
    next(err);
  }
};

export const submitTest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.sub;
    const { testId, answers, clientDurationSeconds } = req.body;
    const result = await examService.submitTest(
      userId,
      testId,
      answers,
      clientDurationSeconds
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getTestResult = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.sub;
    const result = await import("../models/testResult.model").then((m) =>
      m.default.findById(req.params.id).populate("answers.questionId")
    );
    if (!result) throw Object.assign(new Error("Not found"), { status: 404 });
    if (
      String(result.user) !== String(userId) &&
      (req as any).user.role !== "admin"
    )
      throw Object.assign(new Error("Forbidden"), { status: 403 });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

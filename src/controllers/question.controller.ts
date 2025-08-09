import { Request, Response, NextFunction } from "express";
import * as qService from "../services/question.service";

export const createQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = req.body;
    const q = await qService.createQuestion(payload);
    res.status(201).json({ success: true, data: q });
  } catch (err) {
    next(err);
  }
};

export const updateQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const q = await qService.updateQuestion(req.params.id, req.body);
    res.json({ success: true, data: q });
  } catch (err) {
    next(err);
  }
};

export const deleteQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const q = await qService.deleteQuestion(req.params.id);
    res.json({ success: true, data: q });
  } catch (err) {
    next(err);
  }
};

export const listQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filter: any = {};
    if (req.query.level) filter.level = String(req.query.level);
    if (req.query.competency) filter.competency = String(req.query.competency);
    const data = await qService.getQuestions(filter);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

import { Types } from "mongoose";
import { IQuestion } from "../interfaces/question.interface";
import questionModel from "../models/question.model";

export async function createQuestion(payload: IQuestion) {
  const q = new questionModel(payload);
  await q.save();
  return q;
}

export async function updateQuestion(id: string, payload: Partial<IQuestion>) {
  if (!Types.ObjectId.isValid(id))
    throw Object.assign(new Error("Invalid id"), { status: 400 });
  const q = await questionModel.findByIdAndUpdate(id, payload, { new: true });
  if (!q) throw Object.assign(new Error("Question not found"), { status: 404 });
  return q;
}

export async function deleteQuestion(id: string) {
  if (!Types.ObjectId.isValid(id))
    throw Object.assign(new Error("Invalid id"), { status: 400 });
  const q = await questionModel.findByIdAndDelete(id);
  if (!q) throw Object.assign(new Error("Question not found"), { status: 404 });
  return q;
}

export async function getQuestions(filter: Partial<IQuestion> = {}) {
  return questionModel.find(filter).lean();
}

/**
 * Get random N questions for the provided competency/levels
 */
export async function getRandomQuestionsByLevels(
  levels: string[],
  count: number
) {
  const pipeline = [
    { $match: { level: { $in: levels } } },
    { $sample: { size: count } },
  ];
  return questionModel.aggregate(pipeline);
}

import mongoose, { Schema, Document } from "mongoose";
import { IQuestion } from "../interfaces/question.interface";

export interface IQuestionDoc extends IQuestion, Document {}

const QuestionSchema = new Schema<IQuestionDoc>(
  {
    questionText: { type: String, required: true },
    options: { type: [String], default: [] },
    correctAnswer: { type: Schema.Types.Mixed, required: true },
    competency: { type: String, required: true, index: true },
    level: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["single", "multiple", "truefalse", "short"],
      default: "single",
    },
    marks: { type: Number, default: 1 },
  },
  { timestamps: true }
);

QuestionSchema.index({ competency: 1, level: 1 });

export default mongoose.model<IQuestionDoc>("Question", QuestionSchema);

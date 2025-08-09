import mongoose, { Schema, Document } from "mongoose";
import { ITestResult } from "../interfaces/testResult.interface";

export interface ITestResultDoc extends ITestResult, Document {}

const AnswerSchema = new Schema({
  questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
  answer: { type: Schema.Types.Mixed, required: true },
  correct: { type: Boolean },
  marksObtained: { type: Number },
});

const TestResultSchema = new Schema<ITestResultDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    step: { type: Number, required: true },
    levelsTested: [{ type: String, required: true }],
    questions: [
      { type: Schema.Types.ObjectId, ref: "Question", required: true },
    ],
    answers: [AnswerSchema],
    totalMarks: { type: Number, required: true },
    obtainedMarks: { type: Number, required: true },
    percentage: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    levelAwarded: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2", null],
      default: null,
    },
    canProceedToNextStep: { type: Boolean, default: false },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date },
    durationSeconds: { type: Number, required: true },
    clientDurationSeconds: { type: Number },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ITestResultDoc>("TestResult", TestResultSchema);

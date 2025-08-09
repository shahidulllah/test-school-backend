import { Level } from "./question.interface";

export interface IAnswer {
  questionId: string;
  answer: string | string[];
  correct?: boolean;
  marksObtained?: number;
}

export interface ITestResult {
  _id?: string;
  user: string;
  step: 1 | 2 | 3;
  levelsTested: Level[];
  questions: string[];
  answers: IAnswer[];
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  passed: boolean;
  levelAwarded?: Level | null;
  canProceedToNextStep: boolean;
  startedAt: Date;
  submittedAt?: Date;
  durationSeconds: number;
  clientDurationSeconds?: number;
  ipAddress?: string;
  createdAt?: Date;
}

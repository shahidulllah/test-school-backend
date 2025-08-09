export type Competency = string;
export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type QuestionType = "single" | "multiple" | "truefalse" | "short";

export interface IQuestion {
  _id?: string;
  questionText: string;
  options: string[];
  correctAnswer: string | string[];
  competency: Competency;
  level: Level;
  type: QuestionType;
  marks?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

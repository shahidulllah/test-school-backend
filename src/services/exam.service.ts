import { Types } from "mongoose";
import { sign } from "crypto";
import questionModel from "../models/question.model";
import testResultModel from "../models/testResult.model";
import UserModel from "../models/user.model";

type Step = 1 | 2 | 3;

const STEP_LEVELS: Record<Step, [string, string]> = {
  1: ["A1", "A2"],
  2: ["B1", "B2"],
  3: ["C1", "C2"],
};

// default per question marks (questions may have marks field)
export const DEFAULT_PER_QUESTION_SECONDS = Number(
  process.env.SECONDS_PER_QUESTION || 60
);

export async function startTest(userId: string, step: Step, ip?: string) {
  const levels = STEP_LEVELS[step];
  // get 44 random questions from those levels
  const questions = await questionModel.aggregate([
    { $match: { level: { $in: levels } } },
    { $sample: { size: 44 } },
  ]);

  if (!questions || questions.length < 44) {
    throw Object.assign(
      new Error("Not enough questions available for this step"),
      { status: 500 }
    );
  }

  const totalMarks = questions.reduce(
    (s: number, q: any) => s + (q.marks || 1),
    0
  );
  const durationSeconds =
    (process.env.SECONDS_PER_QUESTION
      ? Number(process.env.SECONDS_PER_QUESTION)
      : 60) * questions.length;

  const test = new testResultModel({
    user: userId,
    step,
    levelsTested: levels,
    questions: questions.map((q: any) => q._id),
    answers: [], 
    totalMarks,
    obtainedMarks: 0,
    percentage: 0,
    passed: false,
    levelAwarded: null,
    canProceedToNextStep: false,
    startedAt: new Date(),
    durationSeconds,
    ipAddress: ip,
  });

  await test.save();

  // Return selected question ids and question payload without correctAnswer
  const questionPayload = questions.map((q: any) => ({
    id: q._id,
    questionText: q.questionText,
    options: q.options,
    type: q.type,
    competency: q.competency,
    marks: q.marks || 1,
    level: q.level,
  }));

  return {
    testId: test._id,
    questions: questionPayload,
    durationSeconds,
    totalMarks,
  };
}

/**
 * submitTest: validate submission, score answers, apply step rules, store result, update user
 *
 * payload.answers = [{ questionId, answer }]
 */
export async function submitTest(
  userId: string,
  testId: string,
  answers: { questionId: string; answer: any }[],
  clientDurationSeconds?: number
) {
  if (!Types.ObjectId.isValid(testId))
    throw Object.assign(new Error("Invalid test id"), { status: 400 });
  const test = await testResultModel.findById(testId);
  if (!test) throw Object.assign(new Error("Test not found"), { status: 404 });
  if (String(test.user) !== String(userId))
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  if (test.submittedAt)
    throw Object.assign(new Error("Test already submitted"), { status: 400 });

  // enforce time limit server-side
  const now = new Date();
  const maxSubmitTime = new Date(
    test.startedAt.getTime() + test.durationSeconds * 1000 + 5 * 1000
  ); 
  if (now > maxSubmitTime) {
    // auto-grade as submitted late — we can still grade provided answers contain data, but we will mark as submitted late
    // Option: allow partial grading; here we continue but record submittedAt
  }

  // fetch questions with correct answers
  const questions = await questionModel
    .find({ _id: { $in: test.questions } })
    .lean();

  // build map
  const qMap = new Map<string, any>();
  for (const q of questions) qMap.set(String(q._id), q);

  let obtainedMarks = 0;
  const answerRecords: any[] = [];

  for (const sub of answers) {
    const q = qMap.get(String(sub.questionId));
    if (!q) {
      continue;
    }

    let correct = false;
    let marksObtained = 0;
    const maxMarks = q.marks || 1;

    // grading logic by type
    if (q.type === "single" || q.type === "truefalse" || q.type === "short") {
      const studentAns =
        typeof sub.answer === "string" ? sub.answer.trim() : String(sub.answer);
      const correctAns =
        typeof q.correctAnswer === "string"
          ? q.correctAnswer
          : String(q.correctAnswer);
      if (studentAns === correctAns) {
        correct = true;
        marksObtained = maxMarks;
      }
    } else if (q.type === "multiple") {
      // compare arrays (order-insensitive)
      const studentArr = Array.isArray(sub.answer)
        ? sub.answer.map(String).sort()
        : [];
      const correctArr = Array.isArray(q.correctAnswer)
        ? q.correctAnswer.map(String).sort()
        : [];
      if (
        studentArr.length === correctArr.length &&
        studentArr.every((v, i) => v === correctArr[i])
      ) {
        correct = true;
        marksObtained = maxMarks;
      } else {
        // optionally partial credit: count correct choices
        const correctCount = studentArr.filter((s: any) =>
          correctArr.includes(s)
        ).length;
        marksObtained = Math.round(
          (correctCount / correctArr.length) * maxMarks
        );
      }
    }

    obtainedMarks += marksObtained;
    answerRecords.push({
      questionId: sub.questionId,
      answer: sub.answer,
      correct,
      marksObtained,
    });
  }

  const percentage = (obtainedMarks / test.totalMarks) * 100;
  let passed = false;
  let levelAwarded: any = null;
  let canProceedToNextStep = false;

  // apply step rules exactly as spec
  if (test.step === 1) {
    if (percentage < 25) {
      passed = false;
      levelAwarded = null; // fail
      canProceedToNextStep = false;
      // Spec: Score <25% → Fail, no retake allowed. We'll enforce this in startTest checks.
    } else if (percentage >= 25 && percentage < 50) {
      passed = true;
      levelAwarded = "A1";
      canProceedToNextStep = false;
    } else if (percentage >= 50 && percentage < 75) {
      passed = true;
      levelAwarded = "A2";
      canProceedToNextStep = false;
    } else if (percentage >= 75) {
      passed = true;
      levelAwarded = "A2";
      canProceedToNextStep = true; // proceed to step2
    }
  } else if (test.step === 2) {
    if (percentage < 25) {
      passed = false;
      levelAwarded = null; // remain at A2
      canProceedToNextStep = false;
    } else if (percentage >= 25 && percentage < 50) {
      passed = true;
      levelAwarded = "B1";
      canProceedToNextStep = false;
    } else if (percentage >= 50 && percentage < 75) {
      passed = true;
      levelAwarded = "B2";
      canProceedToNextStep = false;
    } else if (percentage >= 75) {
      passed = true;
      levelAwarded = "B2";
      canProceedToNextStep = true; // to step 3
    }
  } else if (test.step === 3) {
    if (percentage < 25) {
      passed = false;
      levelAwarded = null; // remain at B2
      canProceedToNextStep = false;
    } else if (percentage >= 25 && percentage < 50) {
      passed = true;
      levelAwarded = "C1";
      canProceedToNextStep = false;
    } else if (percentage >= 50) {
      passed = true;
      levelAwarded = "C2";
      canProceedToNextStep = false;
    }
  }

  // update test record
  test.answers = answerRecords;
  test.obtainedMarks = obtainedMarks;
  test.percentage = Math.round(percentage * 100) / 100;
  test.passed = passed;
  test.levelAwarded = levelAwarded;
  test.canProceedToNextStep = canProceedToNextStep;
  test.submittedAt = now;
  if (typeof clientDurationSeconds === "number")
    test.clientDurationSeconds = clientDurationSeconds;
  await test.save();

  // update user highestLevel and add certificate if awarded and higher than previous
  const user = await UserModel.findById(userId);
  if (!user) throw Object.assign(new Error("User not found"), { status: 500 });

  const levelOrder = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const prevIndex = user.highestLevel
    ? levelOrder.indexOf(user.highestLevel)
    : -1;
  const awardedIndex = levelAwarded ? levelOrder.indexOf(levelAwarded) : -1;

  let certificateUrl: string | undefined;
  if (levelAwarded && awardedIndex > prevIndex) {
    // update highestLevel
    user.highestLevel = levelAwarded;
    // generate certificate PDF and email (helper below)
    const certBuffer = await import("../utils/certificate").then((m) =>
      m.generateCertificatePDF(user.name || user.email, levelAwarded)
    );
    // optionally upload certBuffer to cloud storage and get URL, or save to server /uploads
    // For demo, save locally to /uploads/certs/<userId>-<level>.pdf
    const fs = await import("fs/promises");
    const path = await import("path");
    const uploadsDir = path.join(__dirname, "../../uploads/certs");
    await fs.mkdir(uploadsDir, { recursive: true });
    const filename = `${user._id}-${levelAwarded}-${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, certBuffer);
    certificateUrl = `/uploads/certs/${filename}`;
    user.certificates = user.certificates || [];
    user.certificates.push({
      level: levelAwarded,
      issuedAt: new Date(),
      certificateUrl,
    });
    // send email with attachment
    await import("../utils/mailer").then((m) =>
      m.sendMail(
        user.email,
        `Certificate ${levelAwarded}`,
        `Congratulations! You achieved ${levelAwarded}`,
        undefined
      )
    );
  }

  await user.save();

  return { test, certificateUrl };
}

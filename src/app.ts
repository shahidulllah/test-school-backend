import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import { errorHandler } from "./middlewares/error.middleware";
import protectedRoutes from "./routes/protected.routes";
import questionRoutes from "./routes/question.routes";
import examRoutes from "./routes/exam.routes";

dotenv.config();
connectDB();

const app = express();

//middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(errorHandler);

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/exam", examRoutes);

//Checking response
app.get("/", (_req, res) =>
  res.send("Welcome to Test_School assesment platform..!!")
);

export default app;

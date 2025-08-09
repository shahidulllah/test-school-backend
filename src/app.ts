import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import { errorHandler } from "./middlewares/error.middleware";

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

//Checking response
app.get("/", (_req, res) =>
  res.send("Welcome to Test_School assesment platform..!!")
);

export default app;

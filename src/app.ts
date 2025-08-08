import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

//middlewares
app.use(cors());
app.use(express.json());

//Routes
app.get("/", (_req, res) => res.send("Test School is Running Successfully !!"));

export default app;

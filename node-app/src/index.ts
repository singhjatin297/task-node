import express from "express";
import type { NextFunction, Request, Response } from "express";
import router from "./route/index.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { redisClient } from "./redis/index.js";
import type { CustomError } from "./lib.js";

const app = express();

await redisClient.connect();

app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use(router);

app.get("/health-check", (_req: Request, res: Response) => {
  res.status(200).json({ message: "Server is healthy" });
});

app.use((err: CustomError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ message: err.message });
});

const PORT = 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

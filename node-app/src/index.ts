import express from "express";
import type { Request, Response } from "express";
import router from "./route/index.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { redisClient } from "./redis/index.js";

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

const PORT = 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

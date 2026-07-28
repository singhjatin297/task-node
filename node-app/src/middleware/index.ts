import dotenv from "dotenv";
import * as db from "../db/index.js";
import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

dotenv.config();

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Auth token missing" });
  }

  const token = authHeader.slice(7);
  if (!token || typeof token !== "string") {
    return res.status(401).json({ error: "Auth token is required" });
  }

  const secret = process.env.ACCESS_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "JWT secret is missing" });
  }

  try {
    const decoded = jwt.verify(token, secret) as { email: string };
    if (!decoded || typeof decoded.email !== "string") {
      return res.status(401).json({ error: "Invalid token" });
    }
    const user = await db.query("SELECT email FROM users WHERE email = $1", [
      decoded.email,
    ]);
    if (!user.rows.length) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = { email: user.rows[0].email };

    next();
  } catch (err) {
    console.error("Auth middleware failed: ", err);
    return res.status(401).json({ error: "Invalid auth token" });
  }
};

export default authMiddleware;

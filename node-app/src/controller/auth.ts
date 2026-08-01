import type { NextFunction, Request, Response } from "express";
import {
  loginService,
  refreshService,
  signupService,
} from "../service/auth.js";

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(401).json({ error: "Email or Password is missing" });
  }
  try {
    const token = await loginService(email, password);
    return res
      .status(200)
      .json({ message: "login successful!!", tokens: token });
  } catch (err) {
    console.log("Login unsuccessful: ", err);
    next(err);
  }
};

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(401).json({ error: "Email or Password is missing" });
  }
  try {
    const data = await signupService(email, password);
    return res.status(200).json({ data, message: "Signup successful!!" });
  } catch (err) {
    console.log("Signup unsuccessful: ", err);
    next(err);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.slice(7);

  if (!token) {
    return res.status(401).json({ error: "Token missing in header" });
  }

  try {
    const data = await refreshService(token);
    return res
      .status(200)
      .json({ tokens: data, message: "Refresh successful !!" });
  } catch (err) {
    console.log("Refresh unsuccessful: ", err);
    next(err);
  }
};

import type { Request, Response } from "express";
import {
  loginService,
  refreshService,
  signupService,
} from "../service/auth.js";

export const login = async (req: Request, res: Response) => {
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
    return res.status(500).json({ error: "Login failed" });
  }
};

export const signup = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(401).json({ error: "Email or Password is missing" });
  }
  try {
    const data = await signupService(email, password);
    return res.status(200).json({ data, message: "Signup successful!!" });
  } catch (err) {
    console.log("Signup unsuccessful: ", err);
    return res.status(500).json({ error: "Signup failed" });
  }
};

export const refresh = async (req: Request, res: Response) => {
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
    return res.status(401).json({ error: "Refresh failed" });
  }
};

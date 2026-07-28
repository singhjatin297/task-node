import express from "express";
import { login, refresh, signup } from "../controller/auth.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/refresh", refresh);

export default router;

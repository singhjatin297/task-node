import express from "express";
import { login, refresh, signup } from "../controller/auth.js";
import authMiddleware from "../middleware/index.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/refresh", refresh);

export default router;

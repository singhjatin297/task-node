import express from "express";
import authRoute from "./auth.js";
import taskRoute from "./task.js";

const router = express();

router.use("/tasksapi", taskRoute);
router.use("/authapi", authRoute);

export default router;

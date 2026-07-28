import express from "express";
import {
  getAllTasks,
  createTask,
  deleteTask,
  getTaskById,
  searchTasks,
  updateTask,
} from "../controller/task.js";
import authMiddleware from "../middleware/index.js";

const router = express.Router();

router.get("/tasks", authMiddleware, getAllTasks);
router.post("/tasks", authMiddleware, createTask);
router.get("/tasks/search", authMiddleware, searchTasks);
router.get("/tasks/:id", authMiddleware, getTaskById);
router.patch("/tasks/:id", authMiddleware, updateTask);
router.delete("/tasks/:id", authMiddleware, deleteTask);

export default router;

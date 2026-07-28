import type { Request, Response } from "express";
import {
  createTaskService,
  deleteTaskService,
  getAllTasksService,
  getTaskByIdService,
  searchTasksService,
  updateTaskService,
} from "../service/task.js";
import type { Task } from "../lib.js";

interface TaskQuery {
  title: string;
}

export async function getAllTasks(req: Request, res: Response) {
  try {
    const email = req.user?.email;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Author Email is required" });
    }
    const data = await getAllTasksService(email);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getTaskById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Task Id is required" });
    }
    const data = await getTaskByIdService(id);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function createTask(req: Request, res: Response) {
  try {
    const email = req.user?.email;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Author Email is required" });
    }
    const taskData = req.body as Task;
    const data = await createTaskService(taskData, email);
    return res
      .status(200)
      .json({ success: true, message: "Task created succesfully", data });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function updateTask(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const email = req.user?.email;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Author Email is required" });
    }
    const taskData = req.body as Partial<Task>;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Task Id is required" });
    }
    const data = await updateTaskService(id, taskData, email);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function deleteTask(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Task Id is required" });
    }
    const email = req.user?.email;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Author Email is required" });
    }
    const data = await deleteTaskService(id, email);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function searchTasks(req: Request, res: Response) {
  try {
    const { title } = req.query;
    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "Search term is required" });
    }
    const data = await searchTasksService(title);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

import type { NextFunction, Request, Response } from "express";
import {
  createTaskService,
  deleteTaskService,
  getAllTasksService,
  getTaskByIdService,
  searchTasksService,
  updateTaskService,
} from "../service/task.js";
import type { Task } from "../lib.js";

export async function getAllTasks(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const email = req.user?.email;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Author Email is required" });
  }

  try {
    const data = await getAllTasksService(email);
    return res.status(200).json(data);
  } catch (err) {
    console.log("Get All Tasks error: ", err);
    next(err);
  }
}

export async function getTaskById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { id } = req.params;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Task Id is required" });
  }

  const email = req.user?.email;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Author Email is required" });
  }

  try {
    const data = await getTaskByIdService(id, email);
    return res.status(200).json(data);
  } catch (err) {
    console.log("Get Task by Id error: ", err);
    next(err);
  }
}

export async function createTask(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const email = req.user?.email;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Author Email is required" });
  }

  try {
    const taskData = req.body as Task;
    const data = await createTaskService(taskData, email);
    return res
      .status(201)
      .json({ success: true, message: "Task created succesfully", data });
  } catch (err) {
    console.log("Get Task by Id error: ", err);
    next(err);
  }
}

export async function updateTask(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { id } = req.params;
  const email = req.user?.email;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Author Email is required" });
  }

  try {
    const taskData = req.body as Partial<Task>;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Task Id is required" });
    }
    const data = await updateTaskService(id, taskData, email);
    return res.status(200).json(data);
  } catch (err) {
    console.log("Update Task by error: ", err);
    next(err);
  }
}

export async function deleteTask(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { id } = req.params;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Task Id is required" });
  }
  const email = req.user?.email;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Author Email is required" });
  }

  try {
    const data = await deleteTaskService(id, email);
    return res.status(200).json(data);
  } catch (err) {
    console.log("Delete Task by Id error: ", err);
    next(err);
  }
}

export async function searchTasks(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { title } = req.query;
  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "Search term is required" });
  }

  try {
    const data = await searchTasksService(title);
    return res.status(200).json(data);
  } catch (err) {
    console.log("Search Task error: ", err);
    next(err);
  }
}

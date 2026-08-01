import { CustomErrorCode, type CustomError, type Task } from "../lib.js";
import * as db from "../db/index.js";
import { redisClient } from "../redis/index.js";

export async function getAllTasksService(email: string) {
  try {
    const redisCacheKey = `task:${email}`;
    const tasksByRedis = await redisClient.hVals(redisCacheKey);
    if (tasksByRedis?.length > 0) {
      console.log("REDIS IS USED");
      return tasksByRedis?.map((task) => JSON.parse(task) as Task);
    }

    const data = await db.query(
      'SELECT * FROM tasks WHERE "authorEmail" = $1',
      [email],
    );

    const tasks = data.rows || [];

    if (tasks.length == 0) {
      throw new CustomErrorCode("Tasks not found", 200);
    }

    console.log("PG DB was used");

    if (tasks?.length > 0) {
      const redisTasks = Object.fromEntries(
        tasks.map((task) => [task.id, JSON.stringify(task)]),
      );
      await redisClient.hSet(redisCacheKey, redisTasks);
      await redisClient.expire(redisCacheKey, 3600);
    }

    return tasks;
  } catch (err) {
    console.error("Database query failed: ", err);

    if (err instanceof CustomErrorCode) {
      throw err;
    }

    const error = err as CustomError;
    error.statusCode = 500;
    throw error;
  }
}

export async function getTaskByIdService(id: string, email: string) {
  try {
    const data = await db.query(
      'SELECT * FROM tasks WHERE id = $1 AND "authorEmail" = $2',
      [id, email],
    );
    if (data.rows.length == 0 && !data.rows[0]) {
      throw new CustomErrorCode("Task not found", 404);
    }

    return data.rows[0];
  } catch (err) {
    console.error("Database query failed: ", err);
    if (err instanceof CustomErrorCode) {
      throw err;
    }

    const error = err as CustomError;
    error.statusCode = 500;
    throw error;
  }
}

export async function createTaskService(body: Task, email: string) {
  try {
    const data = await db.query(
      'INSERT INTO tasks (title, description, status, "authorEmail") VALUES ($1, $2, $3, $4) RETURNING *',
      [body.title, body.description, body.status, email],
    );

    const newTask = data.rows[0];
    const redisCacheKey = `task:${email}`;

    await redisClient.hSet(
      redisCacheKey,
      String(newTask.id),
      JSON.stringify(data.rows[0]),
    );

    await redisClient.expire(redisCacheKey, 3600);

    return newTask;
  } catch (err) {
    console.error("Database query failed: ", err);

    const error = err as CustomError;
    error.statusCode = 500;
    throw error;
  }
}

export async function updateTaskService(id: string, body: Task, email: string) {
  try {
    const data = await db.query(
      'UPDATE tasks SET title = $1, description = $2, status = $3 WHERE id = $4 AND "authorEmail" = $5 RETURNING *',
      [body.title, body.description, body.status, id, email],
    );

    const updatedTask = data.rows[0];

    const redisCacheKey = `task:${email}`;

    await redisClient.hSet(
      redisCacheKey,
      String(id),
      JSON.stringify(updatedTask),
    );
    await redisClient.expire(redisCacheKey, 3600);

    return updatedTask;
  } catch (err) {
    console.error("Database query failed: ", err);

    const error = err as CustomError;
    error.statusCode = 500;
    throw error;
  }
}

export async function deleteTaskService(id: string, email: string) {
  try {
    const data = await db.query(
      'DELETE FROM tasks WHERE id = $1 AND "authorEmail" = $2 RETURNING *',
      [id, email],
    );
    const deletedTask = data.rows;

    const redisCacheKey = `task:${email}`;
    await redisClient.hDel(redisCacheKey, String(id));

    return deletedTask;
  } catch (err) {
    console.error("Database query failed: ", err);

    const error = err as CustomError;
    error.statusCode = 500;
    throw error;
  }
}

export async function searchTasksService(title: string) {
  try {
    const data = await db.query("SELECT * FROM tasks WHERE title ILIKE $1", [
      `%${title}%`,
    ]);
    return data.rows;
  } catch (err) {
    console.error("Database query failed: ", err);

    const error = err as CustomError;
    error.statusCode = 500;
    throw error;
  }
}

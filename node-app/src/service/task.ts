import type { Task } from "../lib.js";
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

    const tasks = data?.rows;
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
    throw new Error("Database failed query");
  }
}

export async function getTaskByIdService(id: string) {
  try {
    const data = await db.query("SELECT * FROM tasks WHERE id = $1", [id]);
    return data.rows[0];
  } catch (err) {
    console.error("Database query failed: ", err);
    throw new Error("Database failed query");
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
    throw new Error("Database failed query");
  }
}

export async function updateTaskService(id: string, body: Task, email: string) {
  try {
    const data = await db.query(
      "UPDATE tasks SET title = $1, description = $2, status = $3 WHERE id = $4 RETURNING *",
      [body.title, body.description, body.status, id],
    );

    const updatedTask = data.rows[0];

    const redisCacheKey = `task:${email}`;

    await redisClient.hSet(redisCacheKey, String(id), updatedTask);
    await redisClient.expire(redisCacheKey, 3600);

    return updatedTask;
  } catch (err) {
    console.error("Database query failed: ", err);
    throw new Error("Database failed query");
  }
}

export async function deleteTaskService(id: string, email: string) {
  try {
    const data = await db.query("DELETE FROM tasks WHERE id = $1 RETURNING *", [
      id,
    ]);
    const deletedTask = data.rows;

    const redisCacheKey = `task:${email}`;
    await redisClient.hDel(redisCacheKey, String(id));

    return deletedTask;
  } catch (err) {
    console.error("Database query failed: ", err);
    throw new Error("Database failed query");
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
    throw new Error("Database failed query");
  }
}

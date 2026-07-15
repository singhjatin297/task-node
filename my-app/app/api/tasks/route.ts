import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "../backend-url";

type TaskStatus = "STARTED" | "IN_PROGRESS" | "FINISHED";

type CreateTaskBody = {
  title?: string;
  status?: unknown;
};

type UpdateTaskBody = {
  id?: unknown;
  title?: unknown;
  status?: unknown;
};

const VALID_STATUSES: TaskStatus[] = ["STARTED", "IN_PROGRESS", "FINISHED"];

const isTaskStatus = (value: unknown): value is TaskStatus =>
  typeof value === "string" && VALID_STATUSES.includes(value as TaskStatus);

const parseJson = async <T>(request: Request): Promise<T | null> => {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
};

const getAuthHeader = async (request: Request): Promise<string | null> => {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (token) {
    return `Bearer ${token}`;
  }

  return null;
};

export async function GET(request: Request) {
  try {
    const authHeader = await getAuthHeader(request);

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await fetch(getBackendUrl("api/tasks"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      cache: "no-store",
    });

    // if (!data.ok) {
    //   return NextResponse.json(
    //     { error: "Backend rejected request" },
    //     { status: data.status },
    //   );
    // }

    if (!data.ok) {
      // 1. Extract the actual JSON error payload from Go
      const errorData = await data.json().catch(() => ({}));

      // 2. Return Go's exact error message back to your frontend
      return NextResponse.json(
        { error: errorData.error || "Failed to create task on backend" },
        { status: data.status },
      );
    }

    const tasks = await data.json();
    return NextResponse.json({ tasks }, { status: 200 });
  } catch (err) {
    console.error("Error getting tasks: ", err);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = await getAuthHeader(request);

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await parseJson<CreateTaskBody>(request);

    if (!body || typeof body.title !== "string" || body.title.trim() === "") {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    if (body.status !== undefined && !isTaskStatus(body.status)) {
      return NextResponse.json(
        { error: "status must be STARTED, IN_PROGRESS, or FINISHED" },
        { status: 400 },
      );
    }

    const response = await fetch(getBackendUrl("api/tasks"), {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      // 1. Extract the actual JSON error payload from Go
      const errorData = await response.json().catch(() => ({}));

      // 2. Return Go's exact error message back to your frontend
      return NextResponse.json(
        { error: errorData.error || "Failed to create task on backend" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to create task : ${err}` },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const authHeader = await getAuthHeader(request);

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await parseJson<UpdateTaskBody>(request);

    if (!body || typeof body.id !== "string" || body.id.trim() === "") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updates: { title?: string; status?: TaskStatus } = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || body.title.trim() === "") {
        return NextResponse.json(
          { error: "title must be a non-empty string" },
          { status: 400 },
        );
      }
      updates.title = body.title.trim();
    }

    if (body.status !== undefined) {
      if (!isTaskStatus(body.status)) {
        return NextResponse.json(
          { error: "status must be STARTED, IN_PROGRESS, or FINISHED" },
          { status: 400 },
        );
      }
      updates.status = body.status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Provide at least one field to update" },
        { status: 400 },
      );
    }

    const response = await fetch(getBackendUrl(`api/tasks/${body.id}`), {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to update task on backend" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({ data }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authHeader = await getAuthHeader(request);

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await parseJson<{ id?: unknown }>(request);

    if (!body || typeof body.id !== "string" || body.id.trim() === "") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const response = await fetch(getBackendUrl(`api/tasks/${body.id}`), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to delete task on backend" },
        { status: response.status },
      );
    }

    return NextResponse.json(
      { message: "Task deleted successfully" },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "../backend-url";

interface userCredentials {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password }: userCredentials = body;

    const res = await fetch(getBackendUrl("login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { error: errorData.error || "Invalid credentials" },
        { status: res.status },
      );
    }

    const data = await res.json();

    const goIssuedToken = data?.token;

    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === "production";

    console.log("TOKEN LOGGED IN : ", goIssuedToken);

    cookieStore.set({
      name: "token",
      value: goIssuedToken,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 2,
      secure: isProd,
      sameSite: "lax",
    });

    return NextResponse.json(
      { message: "Login successful!", token: goIssuedToken },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json({ error: "Invalid Request" }, { status: 400 });
  }
}

import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBackendUrl } from "../backend-url";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("token")?.value;

    const res = await fetch(getBackendUrl("authapi/refresh"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { error: errorData.error || "Refresh Token expired" },
        { status: res.status },
      );
    }

    const data = await res.json();
    const token = data?.tokens;

    const isProd = process.env.NODE_ENV === "production";

    cookieStore.set({
      name: "token",
      value: token?.RefreshToken,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      secure: isProd,
      sameSite: "lax",
    });

    return NextResponse.json({
      accessToken: token?.AccessToken,
      message: "Access token Refreshed",
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid refresh token" },
      { status: 401 },
    );
  }
}

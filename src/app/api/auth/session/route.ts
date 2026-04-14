import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { SESSION_COOKIE_NAME } from "@/lib/server-auth";

export const runtime = "nodejs";

const SESSION_MAX_AGE_SECONDS = 55 * 60;

function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const idToken =
      typeof body?.idToken === "string" ? body.idToken.trim() : "";

    if (!idToken) {
      return NextResponse.json({ error: "Missing id token" }, { status: 400 });
    }

    const firebaseAdmin = getFirebaseAdmin();
    await firebaseAdmin.auth().verifyIdToken(idToken);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, idToken, buildCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid id token" }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

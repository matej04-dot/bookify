import { NextResponse } from "next/server";
import { getBearerToken, getFirebaseAdmin } from "@/lib/firebase-admin";
import { limitByIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

function normalizeUserId(rawUserId: string): string {
  return decodeURIComponent(rawUserId).trim();
}

function isValidUid(uid: string): boolean {
  return uid.length >= 3 && uid.length <= 128 && /^[A-Za-z0-9:_-]+$/.test(uid);
}

interface RouteContext {
  params: Promise<{ userId: string }>;
}

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const rateLimit = limitByIp(request, "admin-promote", 15, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const firebaseAdmin = getFirebaseAdmin();
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        { error: "Missing bearer token" },
        { status: 401 },
      );
    }

    const idToken = await firebaseAdmin.auth().verifyIdToken(token);
    const requesterId = idToken.uid;

    const { userId: rawUserId = "" } = await context.params;
    const targetUserId = normalizeUserId(rawUserId);

    if (!isValidUid(targetUserId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const db = firebaseAdmin.firestore();
    const requesterRef = db.collection("users").doc(requesterId);
    const targetRef = db.collection("users").doc(targetUserId);

    await db.runTransaction(async (tx) => {
      const requesterSnap = await tx.get(requesterRef);
      const requesterRole = requesterSnap.exists
        ? requesterSnap.data()?.role
        : null;

      if (requesterRole !== "admin") {
        throw new HttpError(403, "Forbidden");
      }

      const targetSnap = await tx.get(targetRef);

      if (!targetSnap.exists) {
        throw new HttpError(404, "User not found");
      }

      tx.update(targetRef, {
        role: "admin",
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        updatedBy: requesterId,
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    const message = error?.message || "Failed to promote user";
    const status = message.includes("auth") ? 401 : 500;
    return NextResponse.json({ error: "Failed to promote user" }, { status });
  }
}

import { NextResponse } from "next/server";
import { getBearerToken, getFirebaseAdmin } from "@/lib/firebase-admin";
import { isValidEntityId, normalizeRouteParam } from "@/lib/ids";
import { limitByIp } from "@/lib/rate-limit";
import { getUserModerationState } from "@/lib/user-moderation";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const rateLimit = await limitByIp(
      request,
      "admin-user-promote",
      30,
      60_000,
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: "Missing bearer token" },
        { status: 401 },
      );
    }

    const firebaseAdmin = getFirebaseAdmin();
    const idToken = await firebaseAdmin.auth().verifyIdToken(token);
    const requesterId = idToken.uid;

    const { userId: rawUserId = "" } = await context.params;
    const targetUserId = normalizeRouteParam(rawUserId);

    if (!isValidEntityId(targetUserId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const db = firebaseAdmin.firestore();

    const requesterRef = db.collection("users").doc(requesterId);
    const requesterSnap = await requesterRef.get();
    const requesterRole = requesterSnap.exists ? requesterSnap.data()?.role : null;
    const requesterModeration = await getUserModerationState(db, requesterId);

    if (requesterRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (requesterModeration.isBanned) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetRef = db.collection("users").doc(targetUserId);
    const targetSnap = await targetRef.get();

    if (!targetSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentRole = targetSnap.data()?.role;
    if (currentRole === "admin") {
      return NextResponse.json({
        promoted: false,
        alreadyAdmin: true,
        userId: targetUserId,
      });
    }

    await targetRef.set(
      {
        role: "admin",
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return NextResponse.json({ promoted: true, userId: targetUserId });
  } catch {
    return NextResponse.json(
      { error: "Failed to promote user" },
      { status: 500 },
    );
  }
}
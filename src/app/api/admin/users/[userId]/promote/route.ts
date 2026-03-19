import { NextResponse } from "next/server";
import { getBearerToken, getFirebaseAdmin } from "@/lib/firebase-admin";

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

export async function POST(request: Request, context: RouteContext) {
  try {
    const firebaseAdmin = getFirebaseAdmin();
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
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
    const requesterSnap = await requesterRef.get();
    const requesterRole = requesterSnap.exists ? requesterSnap.data()?.role : null;

    if (requesterRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetRef = db.collection("users").doc(targetUserId);
    const targetSnap = await targetRef.get();

    if (!targetSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await targetRef.update({
      role: "admin",
      updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      updatedBy: requesterId,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    const message = error?.message || "Failed to promote user";
    const status = message.includes("auth") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

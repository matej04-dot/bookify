import { NextResponse } from "next/server";
import { getBearerToken, getFirebaseAdmin } from "@/lib/firebase-admin";
import { isValidEntityId, normalizeRouteParam } from "@/lib/ids";
import { limitByIp } from "@/lib/rate-limit";
import { getUserModerationState } from "@/lib/user-moderation";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ userId: string }>;
}

function normalizeReason(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  return normalized.slice(0, 500);
}

async function getAdminRequestContext(request: Request, context: RouteContext) {
  const token = getBearerToken(request);
  if (!token) {
    return {
      errorResponse: NextResponse.json(
        { error: "Missing bearer token" },
        { status: 401 },
      ),
    };
  }

  const firebaseAdmin = getFirebaseAdmin();
  const idToken = await firebaseAdmin.auth().verifyIdToken(token);
  const requesterId = idToken.uid;

  const { userId: rawUserId = "" } = await context.params;
  const targetUserId = normalizeRouteParam(rawUserId);

  if (!isValidEntityId(targetUserId)) {
    return {
      errorResponse: NextResponse.json(
        { error: "Invalid user id" },
        { status: 400 },
      ),
    };
  }

  const db = firebaseAdmin.firestore();
  const requesterRef = db.collection("users").doc(requesterId);
  const requesterSnap = await requesterRef.get();
  const requesterRole = requesterSnap.exists ? requesterSnap.data()?.role : null;

  if (requesterRole !== "admin") {
    return {
      errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  const requesterModeration = await getUserModerationState(db, requesterId);
  if (requesterModeration.isBanned) {
    return {
      errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  if (requesterId === targetUserId) {
    return {
      errorResponse: NextResponse.json(
        { error: "You cannot ban your own account" },
        { status: 400 },
      ),
    };
  }

  return {
    db,
    firebaseAdmin,
    requesterId,
    targetUserId,
    errorResponse: null as NextResponse<unknown> | null,
  };
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const rateLimit = await limitByIp(request, "admin-user-ban", 30, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const requestContext = await getAdminRequestContext(request, context);
    if (requestContext.errorResponse) {
      return requestContext.errorResponse;
    }

    const body = await request.json().catch(() => null);
    const reason = normalizeReason(body?.reason);

    if (!reason) {
      return NextResponse.json({ error: "Ban reason is required" }, { status: 400 });
    }

    const { db, firebaseAdmin, requesterId, targetUserId } = requestContext;
    const targetRef = db.collection("users").doc(targetUserId);
    const targetSnap = await targetRef.get();

    if (!targetSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetSnap.data()?.isBanned === true) {
      return NextResponse.json({
        banned: false,
        alreadyBanned: true,
        userId: targetUserId,
      });
    }

    await targetRef.set(
      {
        isBanned: true,
        bannedReason: reason,
        bannedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        bannedBy: requesterId,
        unbannedAt: null,
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return NextResponse.json({
      banned: true,
      userId: targetUserId,
      reason,
    });
  } catch {
    return NextResponse.json({ error: "Failed to ban user" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const rateLimit = await limitByIp(request, "admin-user-unban", 30, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const requestContext = await getAdminRequestContext(request, context);
    if (requestContext.errorResponse) {
      return requestContext.errorResponse;
    }

    const { db, firebaseAdmin, targetUserId } = requestContext;
    const targetRef = db.collection("users").doc(targetUserId);
    const targetSnap = await targetRef.get();

    if (!targetSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetSnap.data()?.isBanned !== true) {
      return NextResponse.json({
        unbanned: false,
        alreadyActive: true,
        userId: targetUserId,
      });
    }

    await targetRef.set(
      {
        isBanned: false,
        bannedReason: null,
        unbannedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return NextResponse.json({
      unbanned: true,
      userId: targetUserId,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to unban user" },
      { status: 500 },
    );
  }
}

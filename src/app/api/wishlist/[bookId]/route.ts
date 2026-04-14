import { NextResponse } from "next/server";
import { getBearerToken, getFirebaseAdmin } from "@/lib/firebase-admin";
import { isValidBookId, normalizeBookId } from "@/lib/ids";
import { limitByIp } from "@/lib/rate-limit";
import { getBanErrorMessage } from "@/lib/user-moderation";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ bookId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const rateLimit = await limitByIp(request, "wishlist-status", 120, 60_000);
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
    const userID = idToken.uid;

    const { bookId: rawBookId = "" } = await context.params;
    const bookID = normalizeBookId(rawBookId);

    if (!isValidBookId(bookID)) {
      return NextResponse.json({ error: "Invalid book id" }, { status: 400 });
    }

    const wishlistId = `${userID}_${bookID}`;
    const db = firebaseAdmin.firestore();
    const wishlistSnap = await db.collection("wishlist").doc(wishlistId).get();

    return NextResponse.json({
      inWishlist: wishlistSnap.exists,
      id: wishlistId,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to check wishlist status" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const rateLimit = await limitByIp(request, "wishlist-remove", 40, 60_000);
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
    const userID = idToken.uid;
    const db = firebaseAdmin.firestore();
    const banMessage = await getBanErrorMessage(db, userID);

    if (banMessage) {
      return NextResponse.json({ error: banMessage }, { status: 403 });
    }

    const { bookId: rawBookId = "" } = await context.params;
    const bookID = normalizeBookId(rawBookId);

    if (!isValidBookId(bookID)) {
      return NextResponse.json({ error: "Invalid book id" }, { status: 400 });
    }

    const wishlistId = `${userID}_${bookID}`;
    const ref = db.collection("wishlist").doc(wishlistId);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ deleted: false, id: wishlistId });
    }

    await ref.delete();
    return NextResponse.json({ deleted: true, id: wishlistId });
  } catch {
    return NextResponse.json(
      { error: "Failed to remove wishlist item" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { getBearerToken, getFirebaseAdmin } from "@/lib/firebase-admin";
import { isValidBookId, normalizeBookId } from "@/lib/ids";
import { limitByIp } from "@/lib/rate-limit";
import { getBanErrorMessage } from "@/lib/user-moderation";

export const runtime = "nodejs";

function normalizeText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  return normalized.slice(0, maxLength);
}

export async function POST(request: Request) {
  try {
    const rateLimit = await limitByIp(request, "reviews-create", 40, 60_000);
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
    const userId = idToken.uid;
    const db = firebaseAdmin.firestore();
    const banMessage = await getBanErrorMessage(db, userId);

    if (banMessage) {
      return NextResponse.json({ error: banMessage }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const rawBookId = typeof body?.bookId === "string" ? body.bookId : "";
    const bookId = normalizeBookId(rawBookId);
    const rating = Number(body?.rating);

    if (!isValidBookId(bookId)) {
      return NextResponse.json({ error: "Invalid book id" }, { status: 400 });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    const username = normalizeText(body?.username, 120);
    const comment = normalizeText(body?.comment, 2000);
    const bookName = normalizeText(body?.bookName, 255);

    const reviewRef = db.collection("reviews").doc();
    const aggRef = db.collection("bookAvgRating").doc(bookId);

    await db.runTransaction(async (tx) => {
      const aggSnap = await tx.get(aggRef);

      tx.set(reviewRef, {
        userId,
        bookId,
        rating,
        bookName,
        comment,
        username,
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      });

      if (!aggSnap.exists) {
        tx.set(aggRef, {
          bookId,
          bookName,
          total: rating,
          count: 1,
          createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        });
        return;
      }

      const aggData = aggSnap.data() || {};
      const total = Number(aggData.total ?? 0) + rating;
      const count = Number(aggData.count ?? 0) + 1;

      tx.update(aggRef, {
        total,
        count,
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ id: reviewRef.id, updated: false });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 },
    );
  }
}

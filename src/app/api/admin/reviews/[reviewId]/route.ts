import { NextResponse } from "next/server";
import { getBearerToken, getFirebaseAdmin } from "@/lib/firebase-admin";
import { limitByIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const REVIEW_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const BOOK_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

interface RouteContext {
  params: Promise<{ reviewId: string }>;
}

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const rateLimit = limitByIp(request, "admin-review-delete", 30, 60_000);
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

    const { reviewId: rawReviewId = "" } = await context.params;
    const reviewId = decodeURIComponent(rawReviewId).trim();

    if (!REVIEW_ID_PATTERN.test(reviewId)) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }

    const db = firebaseAdmin.firestore();
    const requesterRef = db.collection("users").doc(requesterId);
    const reviewRef = db.collection("reviews").doc(reviewId);

    await db.runTransaction(async (tx) => {
      const requesterSnap = await tx.get(requesterRef);
      const requesterRole = requesterSnap.exists
        ? requesterSnap.data()?.role
        : null;

      if (requesterRole !== "admin") {
        throw new HttpError(403, "Forbidden");
      }

      const reviewSnap = await tx.get(reviewRef);
      if (!reviewSnap.exists) {
        throw new HttpError(404, "Review not found");
      }

      const reviewData = reviewSnap.data() || {};
      const bookId =
        typeof reviewData.bookId === "string" ? reviewData.bookId : "";

      if (!BOOK_ID_PATTERN.test(bookId)) {
        throw new HttpError(400, "Invalid book id");
      }

      const rating = Number(reviewData.rating ?? 0);
      const aggRef = db.collection("bookAvgRating").doc(bookId);
      const aggSnap = await tx.get(aggRef);

      tx.delete(reviewRef);

      if (!aggSnap.exists) {
        return;
      }

      const aggData = aggSnap.data() || {};
      const currentTotal = Number(aggData.total ?? 0);
      const currentCount = Number(aggData.count ?? 0);
      const nextCount = Math.max(currentCount - 1, 0);
      const nextTotal = Math.max(currentTotal - rating, 0);

      if (nextCount <= 0) {
        tx.delete(aggRef);
        return;
      }

      tx.update(aggRef, {
        total: nextTotal,
        count: nextCount,
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ deleted: true });
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 },
    );
  }
}

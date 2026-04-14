import { NextResponse } from "next/server";
import { getBearerToken, getFirebaseAdmin } from "@/lib/firebase-admin";
import { isValidBookId, isValidReviewId } from "@/lib/ids";
import { limitByIp } from "@/lib/rate-limit";
import { getBanErrorMessage } from "@/lib/user-moderation";

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

export async function handlePatchReviewRequest(
  request: Request,
  reviewId: string,
) {
  try {
    const rateLimit = await limitByIp(request, "reviews-update", 40, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    if (!isValidReviewId(reviewId)) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
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
    const hasRating = body && typeof body.rating !== "undefined";
    const rating = hasRating ? Number(body.rating) : null;

    if (
      hasRating &&
      (!Number.isInteger(rating) || Number(rating) < 1 || Number(rating) > 5)
    ) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    const comment =
      body && Object.prototype.hasOwnProperty.call(body, "comment")
        ? normalizeText(body.comment, 2000)
        : undefined;
    const username =
      body && Object.prototype.hasOwnProperty.call(body, "username")
        ? normalizeText(body.username, 120)
        : undefined;

    const reviewRef = db.collection("reviews").doc(reviewId);

    await db.runTransaction(async (tx) => {
      const reviewSnap = await tx.get(reviewRef);
      if (!reviewSnap.exists) {
        throw new Error("NOT_FOUND");
      }

      const reviewData = reviewSnap.data() || {};
      if (reviewData.userId !== userId) {
        throw new Error("FORBIDDEN");
      }

      const bookId =
        typeof reviewData.bookId === "string" ? reviewData.bookId : "";
      if (!isValidBookId(bookId)) {
        throw new Error("INVALID_BOOK");
      }

      const oldRating = Number(reviewData.rating ?? 0);
      const newRating = hasRating ? Number(rating) : oldRating;
      const aggRef = db.collection("bookAvgRating").doc(bookId);
      const aggSnap = await tx.get(aggRef);

      const updatePayload: Record<string, unknown> = {
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      };

      if (hasRating) {
        updatePayload.rating = newRating;
      }
      if (typeof comment !== "undefined") {
        updatePayload.comment = comment;
      }
      if (typeof username !== "undefined") {
        updatePayload.username = username;
      }

      tx.update(reviewRef, updatePayload);

      if (hasRating) {
        if (!aggSnap.exists) {
          tx.set(aggRef, {
            bookId,
            total: newRating,
            count: 1,
            createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          });
          return;
        }

        const agg = aggSnap.data() || {};
        const total = Number(agg.total ?? 0) - oldRating + newRating;
        const count = Number(agg.count ?? 1);

        tx.update(aggRef, {
          total,
          count,
          updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    return NextResponse.json({ updated: true });
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (error?.message === "INVALID_BOOK") {
      return NextResponse.json({ error: "Invalid book id" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 },
    );
  }
}

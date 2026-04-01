import { NextResponse } from "next/server";
import { getBearerToken, getFirebaseAdmin } from "@/lib/firebase-admin";
import { limitByIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const BOOK_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

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

interface RouteContext {
  params: Promise<{ bookId: string }>;
}

export async function GET(request: Request) {
  try {
    const rateLimit = limitByIp(request, "reviews-list", 90, 60_000);
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

    const url = new URL(request.url);
    const bookId = url.pathname.split("/").pop() || "";

    const normalized = decodeURIComponent(bookId)
      .replace(/^\/?works\//i, "")
      .trim();

    if (!BOOK_ID_PATTERN.test(normalized)) {
      return NextResponse.json({ error: "Invalid book id" }, { status: 400 });
    }

    const db = firebaseAdmin.firestore();

    const snapshot = await db
      .collection("reviews")
      .where("bookId", "==", normalized)
      .orderBy("createdAt", "desc")
      .get();

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const rateLimit = limitByIp(request, "reviews-update", 40, 60_000);
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

    const { bookId: rawReviewId = "" } = await context.params;
    const reviewId = decodeURIComponent(rawReviewId).trim();
    if (!BOOK_ID_PATTERN.test(reviewId)) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
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

    const db = firebaseAdmin.firestore();
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
      if (!BOOK_ID_PATTERN.test(bookId)) {
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

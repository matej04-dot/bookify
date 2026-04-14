import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { isValidBookId, normalizeBookId, normalizeRouteParam } from "@/lib/ids";
import { limitByIp } from "@/lib/rate-limit";
import { handlePatchReviewRequest } from "@/lib/review-update";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ bookId: string }>;
}

export async function GET(request: Request) {
  try {
    const rateLimit = await limitByIp(request, "reviews-list", 90, 60_000);
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

    const normalized = normalizeBookId(bookId);

    if (!isValidBookId(normalized)) {
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
  const { bookId: rawReviewId = "" } = await context.params;
  const reviewId = normalizeRouteParam(rawReviewId);
  return handlePatchReviewRequest(request, reviewId);
}

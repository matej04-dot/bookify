import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { limitByIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const BOOK_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

interface RouteContext {
  params: Promise<{ bookId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const rateLimit = limitByIp(request, "reviews-summary", 120, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const { bookId: rawBookId = "" } = await context.params;
    const normalized = decodeURIComponent(rawBookId)
      .replace(/^\/?works\//i, "")
      .trim();

    if (!BOOK_ID_PATTERN.test(normalized)) {
      return NextResponse.json({ error: "Invalid book id" }, { status: 400 });
    }

    const firebaseAdmin = getFirebaseAdmin();
    const db = firebaseAdmin.firestore();
    const snapshot = await db.collection("bookAvgRating").doc(normalized).get();

    if (!snapshot.exists) {
      return NextResponse.json({ average: null, reviewCount: null });
    }

    const data = snapshot.data() || {};
    const total = Number(data.total ?? 0);
    const count = Number(data.count ?? 0);
    const average = count > 0 ? Math.round((total / count) * 10) / 10 : 0;

    return NextResponse.json({ average, reviewCount: count });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch rating summary" },
      { status: 500 },
    );
  }
}

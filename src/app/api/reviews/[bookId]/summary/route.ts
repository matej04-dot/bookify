import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { isValidBookId, normalizeBookId } from "@/lib/ids";
import { limitByIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ bookId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const rateLimit = await limitByIp(request, "reviews-summary", 120, 60_000);
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
    const normalized = normalizeBookId(rawBookId);

    if (!isValidBookId(normalized)) {
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

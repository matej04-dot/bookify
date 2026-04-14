import { NextResponse } from "next/server";
import { getBearerToken, getFirebaseAdmin } from "@/lib/firebase-admin";
import { limitByIp } from "@/lib/rate-limit";
import { getUserModerationState } from "@/lib/user-moderation";

export const runtime = "nodejs";

type CountItem = {
  key: string;
  label: string;
  reviewCount: number;
};

const toTimestampMs = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : 0;
  }

  if (value && typeof value === "object") {
    const timestampLike = value as {
      toMillis?: () => unknown;
      toDate?: () => unknown;
    };

    if (typeof timestampLike.toMillis === "function") {
      const ms = Number(timestampLike.toMillis());
      if (Number.isFinite(ms)) {
        return ms;
      }
    }

    if (typeof timestampLike.toDate === "function") {
      const dateValue = timestampLike.toDate();
      if (dateValue instanceof Date) {
        const ms = dateValue.getTime();
        if (Number.isFinite(ms)) {
          return ms;
        }
      }
    }
  }

  return 0;
};

const topFiveByReviewCount = (items: Map<string, CountItem>): CountItem[] =>
  Array.from(items.values())
    .sort((a, b) => {
      if (b.reviewCount !== a.reviewCount) {
        return b.reviewCount - a.reviewCount;
      }

      return a.label.localeCompare(b.label);
    })
    .slice(0, 5);

export async function GET(request: Request) {
  try {
    const rateLimit = await limitByIp(request, "admin-stats", 60, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: "Missing bearer token" },
        { status: 401 },
      );
    }

    const firebaseAdmin = getFirebaseAdmin();
    const idToken = await firebaseAdmin.auth().verifyIdToken(token);
    const requesterId = idToken.uid;

    const db = firebaseAdmin.firestore();
    const requesterSnap = await db.collection("users").doc(requesterId).get();
    const requesterRole = requesterSnap.exists
      ? requesterSnap.data()?.role
      : null;
    const requesterModeration = await getUserModerationState(db, requesterId);

    if (requesterRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (requesterModeration.isBanned) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [usersSnap, reviewsSnap, wishlistSnap] = await Promise.all([
      db.collection("users").get(),
      db.collection("reviews").get(),
      db.collection("wishlist").get(),
    ]);

    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    let reviewsLast24h = 0;
    let reviewsLast7d = 0;
    let activeUsers30d = 0;

    const booksByReviewCount = new Map<string, CountItem>();
    const usersByReviewCount = new Map<string, CountItem>();

    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data() || {};
      const lastLoginMs = toTimestampMs(data.lastLogin);
      if (lastLoginMs >= monthAgo) {
        activeUsers30d += 1;
      }
    }

    for (const reviewDoc of reviewsSnap.docs) {
      const data = reviewDoc.data() || {};
      const createdAtMs = toTimestampMs(data.createdAt);

      if (createdAtMs >= dayAgo) {
        reviewsLast24h += 1;
      }
      if (createdAtMs >= weekAgo) {
        reviewsLast7d += 1;
      }

      const bookId = typeof data.bookId === "string" ? data.bookId.trim() : "";
      const bookName =
        typeof data.bookName === "string" && data.bookName.trim().length > 0
          ? data.bookName.trim()
          : bookId;

      if (bookId) {
        const currentBook = booksByReviewCount.get(bookId);
        booksByReviewCount.set(bookId, {
          key: bookId,
          label: bookName || bookId,
          reviewCount: (currentBook?.reviewCount ?? 0) + 1,
        });
      }

      const userId = typeof data.userId === "string" ? data.userId.trim() : "";
      const username =
        typeof data.username === "string" && data.username.trim().length > 0
          ? data.username.trim()
          : userId;

      if (userId) {
        const currentUser = usersByReviewCount.get(userId);
        usersByReviewCount.set(userId, {
          key: userId,
          label: username || userId,
          reviewCount: (currentUser?.reviewCount ?? 0) + 1,
        });
      }
    }

    return NextResponse.json({
      totalUsers: usersSnap.size,
      totalReviews: reviewsSnap.size,
      totalWishlistItems: wishlistSnap.size,
      activeUsers30d,
      reviewsLast24h,
      reviewsLast7d,
      topBooksByReviewCount: topFiveByReviewCount(booksByReviewCount),
      topUsersByReviewCount: topFiveByReviewCount(usersByReviewCount),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 },
    );
  }
}

import {
  getClientAuth,
  getClientDb,
  hasFirebaseClientConfig,
} from "../firebase-config";
import { collection, query, where, getDocs } from "firebase/firestore";
import type { Review } from "../types/Types";

async function getIdTokenOrThrow() {
  if (!hasFirebaseClientConfig()) {
    throw new Error("Missing Firebase client configuration");
  }

  const auth = getClientAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Not authenticated");
  }

  return user.getIdToken();
}

export async function addReview(review: Review) {
  if (!review || !review.userId)
    throw new Error("Invalid review payload: missing userId");
  if (!review.bookId)
    throw new Error(
      "Invalid review payload: missing bookId (set from URL before calling)",
    );

  const idToken = await getIdTokenOrThrow();
  const response = await fetch("/api/reviews", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      bookId: review.bookId,
      rating: review.rating,
      comment: review.comment ?? null,
      username: review.username ?? null,
      bookName: review.bookName ?? null,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || "Failed to submit review");
  }

  const payload = await response.json();
  return { id: payload?.id, updated: false };
}

export async function getUserReviews(userId: string) {
  const db = getClientDb();
  const colRef = collection(db, "reviews");
  const q = query(colRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function updateReview(
  reviewId: string,
  params: {
    rating?: number;
    comment?: string | null;
    username?: string | null;
  },
) {
  if (!reviewId) throw new Error("Missing reviewId");

  const idToken = await getIdTokenOrThrow();
  const response = await fetch(
    `/api/reviews/review/${encodeURIComponent(reviewId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(params),
    },
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || "Failed to update review");
  }

  return { updated: true };
}

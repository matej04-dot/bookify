import { db } from "../firebase-config";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import type { Review } from "../types/Types";

export async function addReview(review: Review) {
  if (!review || !review.userId)
    throw new Error("Invalid review payload: missing userId");
  if (!review.bookId)
    throw new Error(
      "Invalid review payload: missing bookId (set from URL before calling)"
    );

  const colRef = collection(db, "reviews");

  const newDocRef = doc(colRef);
  const aggRef = doc(db, "bookAvgRating", review.bookId);

  try {
    await runTransaction(db, async (tx) => {
      const aggSnap = await tx.get(aggRef);

      tx.set(newDocRef, {
        userId: review.userId,
        bookId: review.bookId,
        rating: review.rating,
        bookName: review.bookName ?? null,
        comment: review.comment ?? null,
        username: review.username ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (!aggSnap.exists()) {
        tx.set(aggRef, {
          bookId: review.bookId,
          bookName: review.bookName ?? null,
          total: review.rating,
          count: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const agg = aggSnap.data() as any;
        const total = (agg.total ?? 0) + review.rating;
        const count = (agg.count ?? 0) + 1;
        tx.update(aggRef, {
          total,
          count,
          updatedAt: serverTimestamp(),
        });
      }
    });

    return { id: newDocRef.id, updated: false };
  } catch (err) {
    console.error("addReview (create) transaction failed:", err);
    throw err;
  }
}

export async function getUserReviews(userId: string) {
  const colRef = collection(db, "reviews");
  const q = query(colRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function updateReview(
  reviewId: string,
  params: { rating?: number; comment?: string | null; username?: string | null }
) {
  if (!reviewId) throw new Error("Missing reviewId");

  const reviewRef = doc(db, "reviews", reviewId);

  try {
    await runTransaction(db, async (tx) => {
      const reviewSnap = await tx.get(reviewRef);
      if (!reviewSnap.exists()) throw new Error("Review not found");

      const reviewData: any = reviewSnap.data();
      const oldRating = Number(reviewData.rating ?? 0);
      const hasNewRating =
        typeof params.rating === "number" && !isNaN(params.rating);
      const newRating = hasNewRating ? Number(params.rating) : oldRating;

      const updatePayload: any = {
        updatedAt: serverTimestamp(),
      };
      if ("comment" in params) updatePayload.comment = params.comment ?? null;
      if ("username" in params)
        updatePayload.username = params.username ?? reviewData.username ?? null;
      if (hasNewRating) updatePayload.rating = newRating;

      const bookId = reviewData.bookId;
      if (!bookId) throw new Error("Review missing bookId");
      const aggRef = doc(db, "bookAvgRating", bookId);
      const aggSnap = await tx.get(aggRef);

      tx.update(reviewRef, updatePayload);

      if (hasNewRating) {
        if (!aggSnap.exists()) {
          tx.set(aggRef, {
            bookId,
            total: newRating,
            count: 1,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          const agg: any = aggSnap.data();
          const total = (agg.total ?? 0) - oldRating + newRating;
          const count = agg.count ?? 1;
          tx.update(aggRef, {
            total,
            count,
            updatedAt: serverTimestamp(),
          });
        }
      }
    });

    return { updated: true };
  } catch (err) {
    console.error("updateReview transaction failed:", err);
    throw err;
  }
}

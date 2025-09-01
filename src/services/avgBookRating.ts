import { db } from "../firebase-config";
import { doc, runTransaction, getDoc, serverTimestamp } from "firebase/firestore";

export interface BookRatingAvg {
  bookId: string;
  total: number;
  count: number;
  createdAt?: any;
  updatedAt?: any;
}

export async function getAverageRating(bookId: string): Promise<BookRatingAvg | null> {
  const ref = doc(db, "bookAvgRatings", bookId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data: any = snap.data();
  return {
    bookId,
    total: data.total ?? 0,
    count: data.count ?? 0,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function incrementAverageRating(bookId: string, rating: number) {
  const ref = doc(db, "bookAvgRatings", bookId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        tx.set(ref, {
          bookId,
          total: rating,
          count: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return;
      }
      const data: any = snap.data();
      const total = (data.total ?? 0) + rating;
      const count = (data.count ?? 0) + 1;
      tx.update(ref, {
        total,
        count,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    console.error("incrementAverageRating failed:", err);
    throw err;
  }
}

export async function adjustAverageRating(bookId: string, oldRating: number, newRating: number) {
  const ref = doc(db, "bookAvgRatings", bookId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        tx.set(ref, {
          bookId,
          total: newRating,
          count: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return;
      }
      const data: any = snap.data();
      const total = (data.total ?? 0) - (oldRating ?? 0) + newRating;
      const count = data.count ?? 1;
      tx.update(ref, {
        total,
        count,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    console.error("adjustAverageRating failed:", err);
    throw err;
  }
}

export async function decrementAverageRating(bookId: string, rating: number) {
  const ref = doc(db, "bookAvgRatings", bookId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const data: any = snap.data();
      const total = (data.total ?? 0) - (rating ?? 0);
      const count = (data.count ?? 1) - 1;
      if (count <= 0) {
        tx.delete(ref);
      } else {
        tx.update(ref, {
          total,
          count,
          updatedAt: serverTimestamp(),
        });
      }
    });
  } catch (err) {
    console.error("decrementAverageRating failed:", err);
    throw err;
  }
}
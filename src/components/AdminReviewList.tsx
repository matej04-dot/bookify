"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../firebase-config";
import {
  collection,
  query,
  where,
  onSnapshot,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import ReviewItem from "./ReviewItem";
import type { Review } from "../types/Types";

interface AdminReviewListProps {
  userId?: string;
}

function AdminReviewList({ userId }: AdminReviewListProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState<(Review & { id: string })[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setError("Missing user id");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(collection(db, "reviews"), where("userId", "==", userId));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
          const data = d.data() as Review;
          return { id: d.id, ...(data as any) } as Review & { id: string };
        });

        arr.sort((a, b) => {
          const ta = a.createdAt?.toDate
            ? a.createdAt.toDate().getTime()
            : a.createdAt
            ? Number(a.createdAt)
            : 0;
          const tb = b.createdAt?.toDate
            ? b.createdAt.toDate().getTime()
            : b.createdAt
            ? Number(b.createdAt)
            : 0;
          return tb - ta;
        });

        setReviews(arr);
        setLoading(false);
      },
      (err) => {
        console.error("AdminReviewList snapshot error:", err);
        setError("Failed to load reviews");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [userId]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
                  User reviews
                </h2>
                <p className="mt-1 text-sm text-gray-500 break-words">
                  Reviews for user:{" "}
                  <span className="font-medium text-gray-700">{userId}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="px-3 py-2 rounded-md bg-white border-2 border-blue-300 text-gray-700 hover:bg-gray-50 transition text-sm"
                  onClick={() => router.push("/admin")}
                >
                  Back to Admin Panel
                </button>
              </div>
            </div>

            {loading && (
              <div className="py-10 flex items-center justify-center">
                <span className="text-blue-600 animate-pulse">
                  Loading reviews...
                </span>
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-100 p-4 text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && reviews.length === 0 && (
              <div className="py-12 flex items-center justify-center">
                <span className="text-gray-400">No reviews for this user.</span>
              </div>
            )}

            <div className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex flex-col h-full bg-blue-100 border border-gray-100 rounded-lg p-4 hover:shadow-lg transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1 ml-1.5">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {review.bookName ?? "Unknown book"}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 truncate">
                          {review.username ?? "Anonymous"} ·{" "}
                          <span>
                            {review.createdAt?.toDate
                              ? review.createdAt.toDate().toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-gray-700 flex-1 bg-gray-50 p-3 rounded-lg">
                      <ReviewItem review={review} />
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/bookDetails/${encodeURIComponent(
                                review.bookId ?? ""
                              )}`
                            )
                          }
                          className="text-xs text-gray-700 font-semibold px-3 py-2 rounded-md bg-blue-400 border border-blue-300 hover:bg-blue-500 transition"
                        >
                          View book
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminReviewList;

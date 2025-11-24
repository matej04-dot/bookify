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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-12 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  User Reviews
                </h2>
                <p className="text-sm text-gray-600 mt-1 break-words">
                  Managing reviews for:{" "}
                  <span className="font-semibold text-blue-600 font-mono text-xs">
                    {userId}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 
                         border-2 border-gray-300 text-gray-700 rounded-xl font-semibold 
                         transition-all duration-200 shadow-sm hover:shadow-md"
                onClick={() => router.push("/admin")}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Admin
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-blue-600 
                         text-blue-600 rounded-xl font-semibold hover:bg-blue-50 
                         transition-all duration-200 shadow-md hover:shadow-lg"
                onClick={() => router.push("/")}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="hidden sm:inline">Home</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 sm:p-8">
            {loading && (
              <div className="py-16 flex flex-col items-center justify-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
                <p className="text-blue-600 font-medium animate-pulse">
                  Loading reviews...
                </p>
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-xl bg-red-50 border-2 border-red-200 p-6 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-red-600 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-red-700 font-semibold">{error}</p>
              </div>
            )}

            {!loading && !error && reviews.length === 0 && (
              <div className="py-16 flex flex-col items-center justify-center">
                <svg
                  className="mx-auto h-20 w-20 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                <p className="text-gray-600 font-semibold text-lg">
                  No reviews found
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  This user hasn't posted any reviews yet
                </p>
              </div>
            )}

            {!loading && !error && reviews.length > 0 && (
              <div>
                <div className="mb-6 flex items-center justify-between pb-4 border-b-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    All Reviews
                  </h3>
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    {reviews.length}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100 
                               rounded-xl p-5 hover:shadow-xl transition-all duration-200 
                               hover:scale-[1.02] hover:border-blue-300 flex flex-col"
                    >
                      <div className="flex items-start gap-3 mb-4 pb-3 border-b border-blue-200">
                        <div className="flex-shrink-0">
                          <svg
                            className="w-10 h-10 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-bold text-gray-900 truncate mb-1">
                            {review.bookName ?? "Unknown book"}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-medium">
                              {review.username ?? "Anonymous"}
                            </span>
                            <span>•</span>
                            <span>
                              {review.createdAt?.toDate
                                ? review.createdAt.toDate().toLocaleDateString()
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 bg-white p-4 rounded-lg mb-4 shadow-sm">
                        <ReviewItem review={review} />
                      </div>

                      <button
                        onClick={() =>
                          router.push(
                            `/bookDetails/${encodeURIComponent(
                              review.bookId ?? ""
                            )}`
                          )
                        }
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 
                                 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
                                 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View Book
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminReviewList;

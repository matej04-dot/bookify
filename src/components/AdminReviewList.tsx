"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClientAuth,
  getClientDb,
  subscribeToAuthChanges,
} from "../firebase-config";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import ReviewItem from "./ReviewItem";
import type { Review } from "../types/Types";
import { Spinner } from "./ui/spinner";

interface AdminReviewListProps {
  userId?: string;
}

function AdminReviewList({ userId }: AdminReviewListProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState<(Review & { id: string })[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToAuthChanges(async (user) => {
      if (!user?.uid) {
        setIsAdmin(false);
        setAuthLoading(false);
        return;
      }

      try {
        const db = getClientDb();
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const role = userDoc.exists() ? (userDoc.data().role as string) : null;
        setIsAdmin(role === "admin");
      } catch {
        setIsAdmin(false);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (authLoading || !isAdmin) {
      setLoading(false);
      return;
    }

    if (!userId) {
      setError("Missing user id");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const db = getClientDb();
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
      () => {
        setError("Failed to load reviews");
        setLoading(false);
      },
    );

    return () => unsub();
  }, [userId, authLoading, isAdmin]);

  const handleDeleteReview = async (reviewId: string) => {
    if (!isAdmin || !reviewId) {
      return;
    }

    const confirmed = confirm("Delete this review permanently?");
    if (!confirmed) {
      return;
    }

    const authUser = getClientAuth().currentUser;
    if (!authUser) {
      alert("You must be logged in as admin.");
      return;
    }

    try {
      setDeletingReviewId(reviewId);
      const idToken = await authUser.getIdToken();

      const response = await fetch(
        `/api/admin/reviews/${encodeURIComponent(reviewId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to delete review");
      }
    } catch {
      alert("Failed to delete review.");
    } finally {
      setDeletingReviewId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Spinner label="Checking permissions..." />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-xl rounded-2xl border border-red-300/60 bg-red-50 p-6 text-center">
          <h2 className="mb-2 text-2xl font-semibold text-red-800">
            Access denied
          </h2>
          <p className="mb-5 text-red-700">
            You do not have admin permissions to access this page.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center justify-center rounded-full border border-red-300/60 bg-white px-5 py-2.5 font-semibold text-red-700 transition hover:bg-red-100"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-1 rounded-full bg-primary/70"></div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
                  User Reviews
                </h2>
                <p className="mt-1 break-words text-sm text-muted-foreground">
                  Managing reviews for:{" "}
                  <span className="font-mono text-xs font-semibold text-primary">
                    {userId}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 font-semibold text-foreground transition hover:bg-muted"
                onClick={() => router.push("/admin")}
              >
                <svg
                  className="h-4 w-4"
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
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 font-semibold text-foreground transition hover:border-primary/50 hover:text-primary"
                onClick={() => router.push("/")}
              >
                <svg
                  className="h-4 w-4"
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

        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="p-6 sm:p-8">
            {loading && (
              <div className="py-16 flex flex-col items-center justify-center">
                <Spinner size="lg" label="Loading reviews..." />
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-2xl border border-red-300/60 bg-red-50 p-6 text-center">
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
                <p className="font-semibold text-red-700">{error}</p>
              </div>
            )}

            {!loading && !error && reviews.length === 0 && (
              <div className="py-16 flex flex-col items-center justify-center">
                <svg
                  className="mx-auto mb-4 h-20 w-20 text-muted-foreground"
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
                <p className="text-lg font-semibold text-foreground">
                  No reviews found
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  This user hasn&apos;t posted any reviews yet
                </p>
              </div>
            )}

            {!loading && !error && reviews.length > 0 && (
              <div>
                <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <svg
                      className="h-6 w-6 text-primary"
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
                  <div className="rounded-full bg-muted px-4 py-2 text-sm font-semibold text-foreground">
                    {reviews.length}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="flex flex-col rounded-2xl border border-border bg-background p-5 transition hover:border-primary/40 hover:shadow-sm"
                    >
                      <div className="mb-4 flex items-start gap-3 border-b border-border pb-3">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-10 w-10 text-primary"
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
                          <div className="mb-1 truncate text-base font-semibold text-foreground">
                            {review.bookName ?? "Unknown book"}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
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

                      <div className="mb-4 flex-1 rounded-xl border border-border bg-card p-4">
                        <ReviewItem review={review} />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/bookDetails/${encodeURIComponent(
                                review.bookId ?? "",
                              )}`,
                            )
                          }
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90"
                        >
                          <svg
                            className="h-4 w-4"
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
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          disabled={deletingReviewId === review.id}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-300/80 bg-red-50 px-4 py-2.5 font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0h8a1 1 0 001-1V5a1 1 0 00-1-1H8a1 1 0 00-1 1v1a1 1 0 001 1z"
                            />
                          </svg>
                          {deletingReviewId === review.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
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

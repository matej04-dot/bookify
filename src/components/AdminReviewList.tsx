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
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  Eye,
  Home,
  MessageSquare,
  ShieldCheck,
  Trash2,
} from "lucide-react";

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
        <div className="w-full max-w-xl rounded-lg border border-red-300/60 bg-red-50 p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-red-300/60 bg-white text-red-700">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-red-800">
            Access denied
          </h2>
          <p className="mb-5 text-red-700">
            You do not have admin permissions to access this page.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-red-300/60 bg-white px-5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-5 sm:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 sm:px-6 lg:px-8">
        <header className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-primary">
                <ClipboardList className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Admin
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-foreground sm:text-4xl">
                  User Reviews
                </h2>
                <p className="mt-1 break-words text-sm text-muted-foreground">
                  Managing reviews for{" "}
                  <span className="font-mono text-xs font-semibold text-primary">
                    {userId}
                  </span>
                </p>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted"
                onClick={() => router.push("/admin")}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Admin
              </button>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/40 hover:bg-accent"
                onClick={() => router.push("/")}
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                Home
              </button>
            </div>
          </div>
        </header>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="p-4 sm:p-5">
            {loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Spinner size="lg" label="Loading reviews..." />
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-lg border border-red-300/60 bg-red-50 p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-red-300/60 bg-white text-red-700">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="font-semibold text-red-700">{error}</p>
              </div>
            )}

            {!loading && !error && reviews.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground">
                  <MessageSquare className="h-6 w-6" aria-hidden="true" />
                </div>
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
                    <ClipboardList
                      className="h-5 w-5 text-primary"
                      aria-hidden="true"
                    />
                    All Reviews
                  </h3>
                  <div className="rounded-lg border border-border bg-muted px-4 py-2 text-sm font-semibold text-foreground">
                    {reviews.length}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="flex flex-col rounded-lg border border-border bg-background p-4 shadow-sm transition hover:border-primary/40 hover:bg-accent/20"
                    >
                      <div className="mb-4 flex items-start gap-3 border-b border-border pb-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                          <BookOpen className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 truncate text-base font-semibold text-foreground">
                            {review.bookName ?? "Unknown book"}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium">
                              {review.username ?? "Anonymous"}
                            </span>
                            <span>/</span>
                            <span>
                              {review.createdAt?.toDate
                                ? review.createdAt.toDate().toLocaleDateString()
                                : "-"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4 flex-1 rounded-lg border border-border bg-card p-4">
                        <ReviewItem review={review} />
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/bookDetails/${encodeURIComponent(
                                review.bookId ?? "",
                              )}`,
                            )
                          }
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          View Book
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          disabled={deletingReviewId === review.id}
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-300/80 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
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

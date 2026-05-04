"use client";

import { useEffect, useState } from "react";
import ReviewItem from "./ReviewItem";
import type { Review } from "../types/Types";
import { Spinner } from "./ui/spinner";
import { EmptyState } from "./ui/empty-state";
import { getClientDb, hasFirebaseClientConfig } from "../firebase-config";
import { collection, onSnapshot, query, where } from "firebase/firestore";

interface ReviewListProps {
  bookId?: string;
}

const getReviewTime = (review: Review) => {
  const createdAt = review.createdAt;

  if (createdAt && typeof createdAt === "object") {
    const timestampLike = createdAt as {
      toMillis?: () => unknown;
      toDate?: () => unknown;
    };

    if (typeof timestampLike.toMillis === "function") {
      const ms = Number(timestampLike.toMillis());
      return Number.isFinite(ms) ? ms : 0;
    }

    if (typeof timestampLike.toDate === "function") {
      const date = timestampLike.toDate();
      if (date instanceof Date && Number.isFinite(date.getTime())) {
        return date.getTime();
      }
    }
  }

  if (typeof createdAt === "number") {
    return Number.isFinite(createdAt) ? createdAt : 0;
  }

  return 0;
};

export default function ReviewsList({ bookId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookId) {
      setReviews([]);
      setLoading(false);
      return;
    }

    const normalized = bookId.replace(/^\/?works\//i, "").trim();
    setLoading(true);
    setError(null);

    if (!normalized || !hasFirebaseClientConfig()) {
      setReviews([]);
      setError(
        !normalized
          ? "Failed to load reviews"
          : "Reviews are temporarily unavailable",
      );
      setLoading(false);
      return;
    }

    const db = getClientDb();
    const reviewsQuery = query(
      collection(db, "reviews"),
      where("bookId", "==", normalized),
    );

    const unsubscribe = onSnapshot(
      reviewsQuery,
      (snap) => {
        const nextReviews = snap.docs
          .map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              }) as Review,
          )
          .sort((a, b) => getReviewTime(b) - getReviewTime(a));

        setReviews(nextReviews);
        setError(null);
        setLoading(false);
      },
      () => {
        setReviews([]);
        setError("Failed to load reviews");
        setLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [bookId]);

  useEffect(() => {
    if (!bookId || hasFirebaseClientConfig()) {
      return;
    }

    let active = true;
    const normalized = bookId.replace(/^\/?works\//i, "").trim();

    const loadFallbackReviews = async () => {
      try {
        const response = await fetch(`/api/reviews/${encodeURIComponent(normalized)}`);
        if (!response.ok) {
          throw new Error("Failed to load reviews");
        }

        const data = (await response.json()) as Review[];
        if (active) {
          setReviews(Array.isArray(data) ? data : []);
          setError(null);
          setLoading(false);
        }
      } catch {
        if (active) {
          setReviews([]);
          setError("Failed to load reviews");
          setLoading(false);
        }
      }
    };

    void loadFallbackReviews();

    return () => {
      active = false;
    };
  }, [bookId]);

  if (!bookId) {
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState
          title="No reviews found"
          description="This book currently has no review context available."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
        <Spinner label="Loading reviews..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
        <EmptyState
          title="Reviews are temporarily unavailable"
          description="Please refresh this page in a moment."
          className="border-0 shadow-none p-2"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
      {reviews.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          description="Be the first to share your thoughts about this book."
          className="border-0 shadow-none p-2"
          icon={
            <svg
              className="h-10 w-10 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          }
        />
      ) : (
        <div className="divide-y divide-border">
          {reviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}

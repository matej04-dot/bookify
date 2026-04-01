"use client";

import { useEffect, useState } from "react";
import ReviewItem from "./ReviewItem";
import type { Review } from "../types/Types";
import { Spinner } from "./ui/spinner";
import { EmptyState } from "./ui/empty-state";

interface ReviewListProps {
  bookId?: string;
}

export default function ReviewsList({ bookId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!bookId) {
      setLoading(false);
      return;
    }

    const normalized = bookId.replace(/^\/?works\//i, "").trim();
    setLoading(true);

    const loadReviews = async () => {
      try {
        const response = await fetch(
          `/api/reviews/${encodeURIComponent(normalized)}`,
        );
        if (!response.ok) {
          throw new Error("Failed to load reviews");
        }

        const data = (await response.json()) as Review[];
        if (!active) {
          return;
        }

        setReviews(Array.isArray(data) ? data : []);
        setError(null);
      } catch {
        if (!active) {
          return;
        }

        setReviews([]);
        setError("Failed to load reviews");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadReviews();

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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 max-w-2xl mx-auto">
        <Spinner label="Loading reviews..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 max-w-2xl mx-auto">
        <EmptyState
          title="Reviews are temporarily unavailable"
          description="Please refresh this page in a moment."
          className="border-0 shadow-none p-2"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 max-w-2xl mx-auto">
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
        <div className="divide-y divide-gray-100">
          {reviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}

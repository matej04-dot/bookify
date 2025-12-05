"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase-config";
import ReviewItem from "./ReviewItem";
import type { Review } from "../types/Types";

interface ReviewListProps {
  bookId?: string;
}

export default function ReviewsList({ bookId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookId) {
      setLoading(false);
      return;
    }

    const normalized = bookId.replace(/^\/?works\//i, "").trim();

    const q = query(
      collection(db, "reviews"),
      where("bookId", "==", normalized),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reviewsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Review[];
        setReviews(reviewsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("ReviewsList error:", err);
        setError("Failed to load reviews");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [bookId]);

  if (!bookId) {
    return (
      <div className="text-center text-gray-500 m-2">No reviews found</div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 max-w-2xl mx-auto">
        <div className="text-center py-6">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 max-w-2xl mx-auto">
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">
            Reviews are temporarily unavailable.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 max-w-2xl mx-auto">
      {reviews.length === 0 ? (
        <div className="text-center py-6">
          <svg
            className="w-10 h-10 text-gray-300 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-gray-500 text-sm">
            No reviews yet. Be the first to share your thoughts!
          </p>
        </div>
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

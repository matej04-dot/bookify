"use client";
import { useState } from "react";
import ReviewComponent from "./ReviewComponent";
import { getClientAuth } from "../firebase-config";

export default function BookDetailsClient({
  bookKey,
  bookName,
}: {
  bookKey: string;
  bookName?: string;
}) {
  const [showReviewModal, setShowReviewModal] = useState(false);

  return (
    <>
      <button
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2"
        onClick={() => {
          const auth = getClientAuth();
          const isAuthenticated = !!auth.currentUser;
          if (isAuthenticated) {
            setShowReviewModal(true);
          } else {
            alert("You must be logged in or registered to leave a review.");
          }
        }}
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
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        Write a Review
      </button>
      {showReviewModal && (
        <ReviewComponent
          onClose={() => setShowReviewModal(false)}
          bookName={bookName}
          bookId={bookKey}
        />
      )}
    </>
  );
}

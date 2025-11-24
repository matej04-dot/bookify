"use client";
import { useState } from "react";
import ReviewComponent from "./ReviewComponent";
import { getAuth } from "firebase/auth";

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
        className="inline-flex items-center gap-2 px-6 py-3 mb-6 text-white font-semibold 
                   bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg 
                   hover:shadow-xl transition-all duration-200 hover:scale-105 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        onClick={() => {
          const auth = getAuth();
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

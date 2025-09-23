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
        className="rounded-lg mb-3 p-2.5 text-white font-semibold bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-lg border border-yellow-500 transition-transform transform hover:scale-105"
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
        Make Review
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

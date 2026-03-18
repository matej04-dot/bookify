"use client";

import { useState } from "react";
import StarRating from "./Rating";
import { addReview } from "../services/reviews";
import { auth } from "../firebase-config";

type ReviewComponentProps = {
  onClose?: () => void;
  bookName?: string | null;
  bookId?: string | null; // Accept bookId as a prop
};

export default function ReviewComponent({
  onClose,
  bookName,
  bookId, // Use bookId prop
}: ReviewComponentProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const user = auth.currentUser;
    if (!user) {
      setError("Not authenticated");
      return;
    }
    if (!bookId) {
      setError("Missing book id");
      return;
    }
    if (rating <= 0) {
      setError("Please provide a rating");
      return;
    }

    setLoading(true);
    try {
      const username =
        user.displayName ?? (user.email ? user.email.split("@")[0] : null);

      // Normalize bookId - remove /works/ prefix if present
      const normalizedBookId = bookId.replace(/^\/?works\//i, "").trim();

      const payload = {
        userId: user.uid,
        bookId: normalizedBookId,
        rating,
        comment: comment.trim() || null,
        username,
        bookName: bookName || null,
      };
      await addReview(payload as any);
      setRating(0);
      setComment("");
      onClose?.();
    } catch (err: any) {
      console.error("addReview failed:", err);
      setError(err?.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex p-3 items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 overflow-auto max-h-[90vh] flex flex-col border border-gray-100"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Write a Review
              </h3>
              {bookName && (
                <p className="text-sm text-gray-600 mt-1">for {bookName}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl py-3 px-4 flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
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
            <p className="text-red-700 font-medium text-sm">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <label className="flex items-center gap-2 text-gray-900 font-semibold mb-3">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            Your Rating
          </label>
          <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100 rounded-xl p-5 flex justify-center">
            <StarRating value={rating} onChange={(v) => setRating(v)} />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Click on a star to rate (1-5)
          </p>
        </div>

        <div className="mb-6 flex-1">
          <label
            htmlFor="review"
            className="flex items-center gap-2 text-gray-900 font-semibold mb-3"
          >
            <svg
              className="w-5 h-5 text-blue-600"
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
            Your Comment
          </label>
          <textarea
            id="review"
            className="w-full border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50 text-base min-h-[120px] transition-all"
            rows={5}
            placeholder="Share your thoughts about this book..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-2">
            Optional - Share your detailed experience
          </p>
        </div>

        <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || rating === 0}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                Submitting...
              </>
            ) : (
              <>
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Submit Review
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

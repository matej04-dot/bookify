"use client";

import { useState } from "react";
import StarRating from "./Rating";
import { addReview } from "../services/reviews";
import { auth } from "../firebase-config";
import { useSearchParams } from "next/navigation";

type ReviewComponentProps = {
  onClose?: () => void;
  bookName?: string | null;
};

export default function ReviewComponent({
  onClose,
  bookName,
}: ReviewComponentProps) {
  const searchParams = useSearchParams();
  const bookId = searchParams.get("bookId");
  const bookKey = searchParams.get("bookKey");
  const targetBookId = bookId ?? bookKey;
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
    if (!targetBookId) {
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

      const payload = {
        userId: user.uid,
        bookId: targetBookId,
        rating,
        comment: comment.trim() || null,
        username,
        bookName: bookName || null,
      };
      console.log("Submitting review payload:", payload);
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
      className="fixed inset-0 flex p-3 items-center justify-center z-50 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-6 overflow-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h3 className="text-xl md:text-2xl font-bold mb-5 text-gray-800 text-center">
          Leave a Review
        </h3>

        {error && (
          <div className="mb-4 text-red-600 text-sm text-center font-medium bg-red-50 rounded-lg py-2 px-3 border border-red-200">
            {error}
          </div>
        )}

        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-2">Rating</label>
          <StarRating value={rating} onChange={(v) => setRating(v)} />
        </div>

        <div className="mb-5">
          <label
            htmlFor="review"
            className="block text-gray-700 font-medium mb-2"
          >
            Comment
          </label>
          <textarea
            id="review"
            className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none bg-gray-50 text-base min-h-[100px]"
            rows={4}
            placeholder="Leave your comment here..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-yellow-300 to-yellow-400 font-semibold py-2.5 rounded hover:from-yellow-400 hover:to-yellow-400 transition-colors shadow text-lg"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}

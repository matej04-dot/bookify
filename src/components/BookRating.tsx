"use client";

import StarRating from "./Rating";
import { useBookAverageRating } from "@/hooks/useBookAverageRating";

interface BookRatingProps {
  bookKey: string;
}

export default function BookRating({ bookKey }: BookRatingProps) {
  const {
    loading: avgLoading,
    average,
    reviewCount,
  } = useBookAverageRating(bookKey);

  return (
    <div className="space-y-2">
      <p className="text-base font-medium text-gray-700">
        {avgLoading
          ? "Loading rating..."
          : average !== null
            ? `Rating: ${average}`
            : "No ratings yet"}
      </p>

      <div className="flex items-center gap-2">
        <StarRating value={average ?? 0} readOnly />
        {average !== null && (
          <span className="text-sm text-gray-600">({average.toFixed(1)})</span>
        )}
      </div>

      <p className="text-sm text-gray-500">
        {reviewCount !== null
          ? `Based on ${reviewCount} user review${reviewCount !== 1 ? "s" : ""}`
          : "No reviews yet"}
      </p>
    </div>
  );
}

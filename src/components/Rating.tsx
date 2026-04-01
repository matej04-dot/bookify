"use client";
import { Rating, RatingButton } from "@/components/ui/rating";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value?: number;
  onChange?: (value: number) => void;
  className?: string;
  readOnly?: boolean;
}

const StarRating = ({
  value = 0,
  onChange,
  className = "",
  readOnly = false,
}: StarRatingProps) => {
  const displayValue = Math.round(value);

  return (
    <Rating
      value={displayValue}
      readOnly={readOnly}
      onValueChange={(v) => {
        if (!readOnly) {
          onChange?.(v);
        }
      }}
      className={cn("flex gap-1", className)}
    >
      {Array.from({ length: 5 }).map((_, index) =>
        readOnly ? (
          <RatingButton
            key={index}
            className="relative w-5 h-5 sm:w-6 sm:h-6 p-0.5"
          >
            <div className="absolute inset-0 text-gray-300">★</div>
            <div
              className="absolute inset-0 overflow-hidden text-yellow-500"
              style={{
                width: `${
                  Math.min(Math.max(displayValue - index, 0), 1) * 100
                }%`,
              }}
            >
              ★
            </div>
          </RatingButton>
        ) : (
          <RatingButton
            key={index}
            className="relative w-5 h-5 sm:w-6 sm:h-6 p-0.5"
          />
        ),
      )}
    </Rating>
  );
};

export default StarRating;

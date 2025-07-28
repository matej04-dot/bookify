"use client";
import { Rating, RatingButton } from "@/components/ui/rating";

const Example = () => (
  <Rating defaultValue={3.5} className="flex gap-1" readOnly>
    {Array.from({ length: 5 }).map((_, index) => (
      <RatingButton
        className="text-yellow-500 w-4 h-4 sm:w-5 sm:h-5"
        key={index}
      />
    ))}
  </Rating>
);

export default Example;

"use client";

import { useEffect, useState } from "react";
import type { Review } from "../types/Types";
import StarRating from "./Rating";

export default function ReviewItem({ review }: { review: Review }) {
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    review.username || "User"
  )}&background=3b82f6&color=fff`;

  const [pathname, setPathname] = useState<string>("");

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  return (
    <div className="border-b border-gray-200 py-4 last:border-b-0">
      <div className="flex items-center gap-3 mb-2">
        <img
          src={avatarUrl}
          alt={review.username || "User"}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
        />
        <div>
          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
            {pathname === "/account" ? review.bookName : review.username}
          </h4>
          <StarRating
            value={review.rating}
            readOnly
            className="scale-75 sm:scale-85 origin-left"
          />
        </div>
      </div>
      <p className="text-gray-700 text-sm sm:text-base leading-relaxed ml-12 sm:ml-13">
        {review.comment}
      </p>
    </div>
  );
}

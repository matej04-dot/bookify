"use client";

import { useEffect, useState } from "react";
import type { Review } from "../types/Types";
import StarRating from "./Rating";

export default function ReviewItem({ review }: { review: Review }) {
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    review.username || "User"
  )}`;

  const reviewDate =
    review.createdAt && typeof review.createdAt.toDate === "function"
      ? review.createdAt.toDate().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Unknown Date";

  const [pathname, setPathname] = useState<string>("");

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  return (
    <div className="border-b border-gray-200 py-4 max-w-full md:max-w-xl lg:max-w-2xl mx-auto">
      <div className="mb-2 p-3 bg-accent rounded-lg">
        <div className="flex items-center mb-2">
          <img
            src={avatarUrl}
            alt={review.username || "User"}
            className="w-10 h-10 rounded-full mr-4"
          />
          <h4 className="font-semibold mb-1.5">
            {pathname === "/account" ? review.bookName : review.username}
          </h4>
        </div>
        <StarRating value={review.rating} readOnly />
      </div>
      <p className="text-sm text-gray-500 ml-2.5 mb-1">
        Reviewed on{` ${reviewDate}`}
      </p>
      <p className="text-gray-700 ml-2.5">{review.comment}</p>
    </div>
  );
}

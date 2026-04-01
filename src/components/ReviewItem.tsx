"use client";

import { useState } from "react";
import Image from "next/image";
import type { Review } from "../types/Types";
import StarRating from "./Rating";

const getInitials = (value: string) => {
  const base = value.includes("@") ? value.split("@")[0] : value;
  const parts = base.split(/[\s._-]+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return base.slice(0, 2).toUpperCase() || "U";
};

export default function ReviewItem({ review }: { review: Review }) {
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const userLabel = review.username || "User";
  const userInitials = getInitials(userLabel);

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    userLabel,
  )}&background=3b82f6&color=fff&size=80`;
  const isAccountPage =
    typeof window !== "undefined" && window.location.pathname === "/account";

  return (
    <div className="border-b border-gray-200 py-4 last:border-b-0">
      <div className="flex items-center gap-3 mb-2">
        {avatarLoadFailed ? (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex-shrink-0 bg-slate-700 text-white text-xs font-bold flex items-center justify-center">
            {userInitials}
          </div>
        ) : (
          <Image
            src={avatarUrl}
            alt={userLabel}
            width={40}
            height={40}
            unoptimized
            onError={() => setAvatarLoadFailed(true)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
          />
        )}
        <div>
          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
            {isAccountPage ? review.bookName : review.username}
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

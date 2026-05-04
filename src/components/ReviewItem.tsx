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
    <div className="py-1">
      <div className="mb-2 flex items-center gap-3">
        {avatarLoadFailed ? (
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground sm:h-10 sm:w-10">
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
            className="h-9 w-9 flex-shrink-0 rounded-full sm:h-10 sm:w-10"
          />
        )}
        <div>
          <h4 className="text-sm font-semibold text-foreground sm:text-base">
            {isAccountPage ? review.bookName : review.username}
          </h4>
          <StarRating
            value={review.rating}
            readOnly
            className="scale-75 sm:scale-85 origin-left"
          />
        </div>
      </div>
      {review.comment && (
        <p className="ml-12 text-sm leading-relaxed text-muted-foreground">
          {review.comment}
        </p>
      )}
    </div>
  );
}

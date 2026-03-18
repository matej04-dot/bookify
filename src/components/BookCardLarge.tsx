"use client";

import { imagesBaseUrl } from "@/utils/Constants";
import { useEffect, useState } from "react";
import StarRating from "./Rating";
import Image from "next/image";
import { useBookAverageRating } from "@/hooks/useBookAverageRating";

type BookProps = {
  book: {
    key: string;
    title: string;
    authors?: { name: string }[];
    cover_edition_key?: string;
  };
  onClick?: () => void;
};

const BookCardLarge = ({ book, onClick }: BookProps) => {
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const {
    loading: avgLoading,
    average,
    reviewCount,
  } = useBookAverageRating(book.key);
  const coverUrl =
    book.cover_edition_key &&
    `${imagesBaseUrl}/b/olid/${book.cover_edition_key}-M.jpg`;

  // Reset states when cover URL changes
  useEffect(() => {
    if (!coverUrl) {
      setLoading(false);
      setImageError(true);
    } else {
      setLoading(true);
      setImageError(false);
    }
  }, [coverUrl]);

  return (
    <div
      onClick={onClick}
      className="flex rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex min-h-[168px] w-40 flex-shrink-0 items-center justify-center rounded-l-xl bg-slate-100 p-3 sm:w-48 sm:min-h-[216px]">
        {loading && !imageError && (
          <div className="h-36 w-full animate-pulse rounded-lg bg-slate-200 sm:h-48" />
        )}
        {coverUrl && !imageError ? (
          <Image
            src={coverUrl}
            width={150}
            height={220}
            className={`h-36 w-full rounded-lg object-cover sm:h-48 ${
              loading ? "hidden" : "block"
            }`}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setImageError(true);
            }}
            alt={`Cover for ${book.title}`}
            priority
          />
        ) : (
          !loading && (
            <div className="flex h-36 w-full flex-col items-center justify-center rounded-lg bg-slate-200 text-slate-400 sm:h-48">
              <svg
                className="w-12 h-12 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <span className="text-sm">No cover</span>
            </div>
          )
        )}
      </div>
      <div className="m-1.5 flex h-44 w-full flex-grow flex-col justify-between p-2 sm:h-48">
        <p className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 sm:text-sm md:text-lg">
          {book.title}
        </p>
        <p className="mb-1 line-clamp-1 text-sm text-slate-600">
          by{" "}
          {book.authors?.map((author) => author.name).join(", ") ||
            "Unknown Author"}
        </p>
        <p className="text-sm font-medium text-slate-700">
          {avgLoading
            ? "Loading rating..."
            : average !== null
              ? `Rating: ${average}`
              : "No ratings yet"}
        </p>

        <StarRating value={average ?? 0} readOnly />
        <p className="mt-2 line-clamp-2 text-xs text-slate-500">
          {reviewCount !== null
            ? `Based on ${reviewCount} user review${
                reviewCount !== 1 ? "s" : ""
              }`
            : "No reviews yet"}
        </p>
      </div>
    </div>
  );
};

export default BookCardLarge;

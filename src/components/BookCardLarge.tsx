"use client";

import { imagesBaseUrl } from "@/utils/Constants";
import { useState } from "react";
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
  const fixedCoverFrameClass = "h-[200px] w-[136px]";
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [erroredUrl, setErroredUrl] = useState<string | null>(null);
  const {
    loading: avgLoading,
    average,
    reviewCount,
  } = useBookAverageRating(book.key);
  const coverUrl =
    book.cover_edition_key &&
    `${imagesBaseUrl}/b/olid/${book.cover_edition_key}-M.jpg`;
  const imageError = Boolean(coverUrl && erroredUrl === coverUrl);
  const loading = Boolean(coverUrl && loadedUrl !== coverUrl && !imageError);
  const hasValidCover = Boolean(coverUrl && !imageError);

  return (
    <div
      onClick={onClick}
      className="group flex h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex w-[164px] flex-shrink-0 items-center justify-center bg-slate-100 p-2 sm:w-[176px] sm:p-3">
        {loading && (
          <div
            className={`${fixedCoverFrameClass} animate-pulse rounded-lg bg-slate-200`}
          />
        )}
        {hasValidCover ? (
          <Image
            src={coverUrl!}
            width={150}
            height={220}
            className={`${fixedCoverFrameClass} rounded-lg object-cover ${
              loading ? "hidden" : "block"
            }`}
            onLoad={() => setLoadedUrl(coverUrl!)}
            onError={() => {
              setErroredUrl(coverUrl!);
            }}
            alt={`Cover for ${book.title}`}
            priority
          />
        ) : (
          !loading && (
            <div
              className={`${fixedCoverFrameClass} flex flex-col items-center justify-center rounded-lg bg-slate-200 text-slate-400`}
            >
              <svg
                className="mb-2 h-10 w-10"
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
              <span className="text-xs font-medium">No cover</span>
            </div>
          )
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between p-3 sm:p-4">
        <div className="space-y-1.5">
          <p className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 md:text-lg">
            {book.title}
          </p>
          <p className="line-clamp-1 text-sm text-slate-600">
            by{" "}
            {book.authors?.map((author) => author.name).join(", ") ||
              "Unknown Author"}
          </p>
        </div>

        <div className="mt-3 space-y-1.5">
          <p className="text-sm font-medium text-slate-700">
            {avgLoading
              ? "Loading rating..."
              : average !== null
                ? `Rating: ${average}`
                : "No ratings yet"}
          </p>
          <StarRating value={average ?? 0} readOnly />
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
            {reviewCount !== null
              ? `Based on ${reviewCount} user review${
                  reviewCount !== 1 ? "s" : ""
                }`
              : "No reviews yet"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookCardLarge;

"use client";

import { useState } from "react";
import { imagesBaseUrl } from "../utils/Constants";
import StarRating from "./Rating";
import Image from "next/image";
import { useBookAverageRating } from "@/hooks/useBookAverageRating";

type BookProps = {
  book: {
    title: string;
    authors?: { name: string }[];
    cover_edition_key?: string;
    key: string;
  };
};

const BookCardMedium = ({ book }: BookProps) => {
  const [loading, setLoading] = useState(true);
  const {
    loading: avgLoading,
    average,
    reviewCount,
  } = useBookAverageRating(book.key);
  const coverUrl =
    book.cover_edition_key &&
    `${imagesBaseUrl}/b/olid/${book.cover_edition_key}-M.jpg`;

  return (
    <div className="mx-auto flex h-full w-full flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:w-40 sm:max-w-xs">
      <div className="flex min-h-[160px] w-full flex-shrink-0 items-center justify-center bg-slate-100 sm:min-h-[208px]">
        {loading && (
          <div className="h-36 w-full animate-pulse rounded-t-xl bg-slate-200 sm:h-48" />
        )}
        {coverUrl ? (
          <Image
            src={coverUrl}
            width={150}
            height={220}
            className={`h-36 w-full object-cover sm:h-48 ${loading ? "hidden" : "block"}`}
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
            alt={`Cover for ${book.title}`}
            priority
          />
        ) : (
          !loading && (
            <div className="flex h-36 w-full items-center justify-center bg-slate-100 text-sm text-slate-500 sm:h-48">
              No cover
            </div>
          )
        )}
      </div>
      <div className="m-1.5 flex h-44 w-full flex-grow flex-col justify-between px-2 py-1.5 sm:h-48 sm:p-2">
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

export default BookCardMedium;

"use client";

import { useEffect, useState } from "react";
import { imagesBaseUrl } from "../utils/Constants";
import StarRating from "./Rating";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase-config";
import Image from "next/image";

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
  const [avgLoading, setAvgLoading] = useState(false);
  const [average, setAverage] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const coverUrl =
    book.cover_edition_key &&
    `${imagesBaseUrl}/b/olid/${book.cover_edition_key}-M.jpg`;

  useEffect(() => {
    let mounted = true;

    const fetchAvgRating = async () => {
      if (!book.key) {
        if (mounted) setAverage(null);
        return;
      }
      const rawKey = book.key.replace("/works/", "");
      setAvgLoading(true);
      try {
        const ref = doc(db, "bookAvgRating", rawKey);
        const snap = await getDoc(ref);
        if (!mounted) return;
        if (!snap.exists()) {
          setAverage(null);
        } else {
          const data: any = snap.data();
          const total = Number(data.total ?? 0);
          const count = Number(data.count ?? 0);
          const avg = count > 0 ? Math.round((total / count) * 10) / 10 : 0;
          setAverage(avg);
          setReviewCount(count);
        }
      } catch (err) {
        console.error("Failed to fetch bookAvgRating:", err);
        if (mounted) setAverage(null);
      } finally {
        if (mounted) setAvgLoading(false);
      }
    };

    fetchAvgRating();
    return () => {
      mounted = false;
    };
  }, [book.key]);

  return (
    <div className="flex flex-col items-center justify-between shadow-lg border border-gray-300 rounded-lg hover:shadow-xl transition-shadow duration-300 w-full sm:w-40 sm:max-w-xs bg-white mx-auto h-full">
      <div className="bg-gray-200 rounded-t-lg flex-shrink-0 flex items-center justify-center w-full min-h-[160px] sm:min-h-[208px]">
        {loading && (
          <div className="h-36 sm:h-48 w-full flex flex-col items-center justify-center bg-gray-300 rounded-t-lg animate-pulse">
            <svg
              className="w-10 h-10 text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div className="h-6 w-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {coverUrl ? (
          <Image
            src={coverUrl}
            width={150}
            height={220}
            className={`rounded-t-lg h-36 sm:h-48 w-full object-cover m-2 ${
              loading ? "hidden" : "block"
            }`}
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
            alt={`Cover for ${book.title}`}
            priority
          />
        ) : (
          !loading && (
            <div className="h-36 sm:h-48 w-full flex items-center justify-center bg-gray-300 text-gray-500">
              No cover
            </div>
          )
        )}
      </div>
      <div className="w-full flex-grow p-3 sm:p-2 justify-around m-1.5 h-44 sm:h-48 flex flex-col">
        <p className="font-semibold text-gray-800 leading-snug text-base sm:text-sm md:text-lg line-clamp-2">
          {book.title}
        </p>
        <p className="text-sm text-gray-600 italic mb-1 line-clamp-1">
          by{" "}
          {book.authors?.map((author) => author.name).join(", ") ||
            "Unknown Author"}
        </p>

        <p className="text-sm font-medium text-gray-700">
          {avgLoading
            ? "Loading rating..."
            : average !== null
            ? `Rating: ${average}`
            : "No ratings yet"}
        </p>

        <StarRating value={average ?? 0} readOnly />

        <p className="text-xs text-gray-500 line-clamp-2 mt-2">
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

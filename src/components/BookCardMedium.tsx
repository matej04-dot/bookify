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
  const [imageError, setImageError] = useState(false);
  const [avgLoading, setAvgLoading] = useState(false);
  const [average, setAverage] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const coverUrl =
    book.cover_edition_key &&
    `${imagesBaseUrl}/b/olid/${book.cover_edition_key}-M.jpg`;

  // Reset loading state when there's no cover
  useEffect(() => {
    if (!coverUrl) {
      setLoading(false);
    }
  }, [coverUrl]);

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
      <div className="bg-gray-200 rounded-t-lg flex-shrink-0 flex items-center justify-center w-full">
        {loading && coverUrl && (
          <div className="h-36 sm:h-48 w-full flex items-center justify-center">
            <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {coverUrl && !imageError ? (
          <Image
            src={coverUrl}
            width={150}
            height={220}
            className={`rounded-t-lg h-36 sm:h-48 w-full object-cover m-2 ${
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
        ) : !loading ? (
          <div className="h-36 sm:h-48 w-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-lg">
            <div className="text-center p-2">
              <svg
                className="w-12 h-12 mx-auto text-gray-400 mb-2"
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
              <span className="text-gray-500 text-xs font-medium">
                No Cover
              </span>
            </div>
          </div>
        ) : null}
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

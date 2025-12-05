"use client";

import { imagesBaseUrl } from "@/utils/Constants";
import { useEffect, useState } from "react";
import StarRating from "./Rating";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase-config";
import Image from "next/image";

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
  const [avgLoading, setAvgLoading] = useState(false);
  const [average, setAverage] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number | null>(null);
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
    <div
      onClick={onClick}
      className="flex rounded-lg shadow-lg border border-gray-200 hover:shadow-xl hover:border-blue-100 transition-shadow duration-300 bg-white"
    >
      <div className="bg-gray-100 rounded-l-lg flex-shrink-0 flex items-center justify-center w-40 sm:w-48 p-3 min-h-[168px] sm:min-h-[216px]">
        {loading && !imageError && (
          <div className="h-36 sm:h-48 w-full flex flex-col items-center justify-center bg-gray-200 rounded-lg animate-pulse">
            <svg
              className="w-12 h-12 text-gray-400 mb-2"
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
            <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {coverUrl && !imageError ? (
          <Image
            src={coverUrl}
            width={150}
            height={220}
            className={`rounded-lg h-36 sm:h-48 w-full object-cover m-3 ${
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
            <div className="h-36 sm:h-48 w-full flex flex-col items-center justify-center bg-gray-200 rounded-lg text-gray-400">
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

export default BookCardLarge;

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
    <div
      onClick={onClick}
      className="flex rounded-lg shadow-lg border border-gray-200 hover:shadow-xl hover:border-blue-100 transition-shadow duration-300 bg-white"
    >
      <div className="bg-gray-100 rounded-l-lg flex-shrink-0 flex items-center justify-center w-40 sm:w-48 p-3">
        {loading && (
          <div className="h-51 flex items-center justify-center">
            <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {coverUrl ? (
          <Image
            src={coverUrl}
            width={150}
            height={220}
            className={`rounded-lg h-36 sm:h-48 w-full object-cover m-3 ${
              loading ? "hidden" : "block"
            }`}
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
            alt={`Cover for ${book.title}`}
            priority
          />
        ) : (
          <div className="h-36 sm:h-48 w-full flex items-center justify-center bg-gray-300 text-gray-500">
            No cover
          </div>
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

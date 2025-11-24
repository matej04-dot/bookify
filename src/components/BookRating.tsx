"use client";

import { useEffect, useState } from "react";
import StarRating from "./Rating";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase-config";

interface BookRatingProps {
  bookKey: string;
}

export default function BookRating({ bookKey }: BookRatingProps) {
  const [avgLoading, setAvgLoading] = useState(false);
  const [average, setAverage] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchAvgRating = async () => {
      if (!bookKey) {
        if (mounted) setAverage(null);
        return;
      }
      const rawKey = bookKey.replace(/^\/?works\//i, "");
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
  }, [bookKey]);

  return (
    <div className="space-y-2">
      <p className="text-base font-medium text-gray-700">
        {avgLoading
          ? "Loading rating..."
          : average !== null
          ? `Rating: ${average}`
          : "No ratings yet"}
      </p>

      <div className="flex items-center gap-2">
        <StarRating value={average ?? 0} readOnly />
        {average !== null && (
          <span className="text-sm text-gray-600">({average.toFixed(1)})</span>
        )}
      </div>

      <p className="text-sm text-gray-500">
        {reviewCount !== null
          ? `Based on ${reviewCount} user review${reviewCount !== 1 ? "s" : ""}`
          : "No reviews yet"}
      </p>
    </div>
  );
}

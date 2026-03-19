"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase-config";

type UseBookAverageRatingResult = {
  loading: boolean;
  average: number | null;
  reviewCount: number | null;
};

export function useBookAverageRating(
  bookKey?: string,
): UseBookAverageRatingResult {
  const [loading, setLoading] = useState(false);
  const [average, setAverage] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchAverage = async () => {
      const normalizedKey = (bookKey ?? "").replace(/^\/?works\//i, "").trim();
      if (!normalizedKey) {
        if (mounted) {
          setAverage(null);
          setReviewCount(null);
        }
        return;
      }

      setLoading(true);
      try {
        const ref = doc(db, "bookAvgRating", normalizedKey);
        const snap = await getDoc(ref);
        if (!mounted) return;

        if (!snap.exists()) {
          setAverage(null);
          setReviewCount(null);
          return;
        }

        const data = snap.data() as { total?: number; count?: number };
        const total = Number(data.total ?? 0);
        const count = Number(data.count ?? 0);
        const avg = count > 0 ? Math.round((total / count) * 10) / 10 : 0;

        setAverage(avg);
        setReviewCount(count);
      } catch {
        if (mounted) {
          setAverage(null);
          setReviewCount(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAverage();

    return () => {
      mounted = false;
    };
  }, [bookKey]);

  return { loading, average, reviewCount };
}

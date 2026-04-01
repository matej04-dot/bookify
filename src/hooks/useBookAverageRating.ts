"use client";

import { useEffect, useState } from "react";

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
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/reviews/${encodeURIComponent(normalizedKey)}/summary`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch rating summary");
        }

        const payload = (await response.json()) as {
          average?: number | null;
          reviewCount?: number | null;
        };

        if (!mounted) return;

        setAverage(
          typeof payload.average === "number" ? payload.average : null,
        );
        setReviewCount(
          typeof payload.reviewCount === "number" ? payload.reviewCount : null,
        );
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

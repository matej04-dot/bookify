"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";
import RecommendedSearch from "./RecommendedSearch";
import { baseUrl } from "@/utils/Constants";

const fetchBookTitles = async (
  query: string,
  signal: AbortSignal,
  retries = 2,
): Promise<string[]> => {
  if (!query.trim() || query.trim().length < 2) return [];

  const url = `${baseUrl}/search.json?q=${encodeURIComponent(
    query,
  )}&mode=everything&limit=5`;

  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const abortHandler = () => controller.abort();

    try {
      if (signal.aborted) {
        return [];
      }
      signal.addEventListener("abort", abortHandler, { once: true });

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "book-app/1.0",
        },
      });

      if (res.ok) {
        const data = await res.json();
        const docs = Array.isArray(data?.docs) ? data.docs : [];
        if (docs.length === 0) {
          return [];
        }
        const uniqueTitles = new Set<string>();
        for (const book of docs) {
          if (typeof book?.title === "string" && book.title.trim()) {
            uniqueTitles.add(book.title.trim());
          }
          if (uniqueTitles.size >= 5) break;
        }
        return Array.from(uniqueTitles);
      }

      // If it's a server error, retry
      if (res.status >= 500 && attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }

      console.warn(`Search API error: ${res.status}`);
      return [];
    } catch (error) {
      if (signal.aborted) {
        return [];
      }
      // Retry on network errors or timeouts
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
      console.warn("Search temporarily unavailable");
      return [];
    } finally {
      clearTimeout(timeoutId);
      signal.removeEventListener("abort", abortHandler);
    }
  }
  return [];
};

export default function Search() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [recommendVisible, setRecommendVisible] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeRequestRef = useRef<AbortController | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setIsNavigating(false);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Only fetch if query is at least 2 characters
    if (newValue.trim().length >= 2) {
      // Debounce API calls by 300ms
      debounceTimeoutRef.current = setTimeout(async () => {
        activeRequestRef.current?.abort();
        const controller = new AbortController();
        activeRequestRef.current = controller;

        const results = await fetchBookTitles(
          newValue.trim(),
          controller.signal,
        );
        if (controller.signal.aborted) return;

        setRecommendations(results);
        setRecommendVisible(results.length > 0);
      }, 300);
    } else {
      setRecommendations([]);
      setRecommendVisible(false);
    }
  };

  const navigateToSearch = useCallback(
    (rawValue: string) => {
      const trimmed = rawValue.trim();
      if (!trimmed || isNavigating) return;

      setIsNavigating(true);
      const formatted = encodeURIComponent(trimmed);
      activeRequestRef.current?.abort();
      setRecommendations([]);
      setRecommendVisible(false);

      const searchKey = `/search?q=${formatted}&mode=everything`;
      router.push(searchKey);
    },
    [isNavigating, router],
  );

  const handleClick = useCallback(() => {
    navigateToSearch(value);
  }, [navigateToSearch, value]);

  const handleSelectRecommendation = (rec: string) => {
    setValue(rec);
    navigateToSearch(rec);
  };

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setRecommendVisible(false);
      }
    };
    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      // Cleanup debounce timeout on unmount
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      activeRequestRef.current?.abort();
    };
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative flex items-center rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="absolute left-4 pointer-events-none">
          <svg
            className="w-5 h-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={value}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleClick();
            }
          }}
          onChange={handleChange}
          placeholder="Search for books, authors, or topics..."
          className="w-full rounded-xl bg-transparent py-3 pl-12 pr-24 text-sm text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        <button
          type="button"
          onClick={handleClick}
          disabled={isNavigating || !value.trim()}
          className="absolute right-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Search
        </button>
      </div>
      <RecommendedSearch
        recommendations={recommendations}
        onSelect={handleSelectRecommendation}
        visible={recommendVisible}
      />
    </div>
  );
}

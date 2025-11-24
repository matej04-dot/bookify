"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";
import RecommendedSearch from "./RecommendedSearch";
import { baseUrl } from "@/utils/Constants";

const fetchBookTitles = async (
  query: string,
  retries = 2
): Promise<string[]> => {
  if (!query.trim() || query.trim().length < 2) return [];

  const url = `${baseUrl}/search.json?q=${encodeURIComponent(
    query
  )}&mode=everything&limit=5`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "book-app/1.0",
        },
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (!data.docs || data.docs.length === 0) {
          return [];
        }
        return data.docs.map((book: { title: string }) => book.title);
      }

      // If it's a server error, retry
      if (res.status >= 500 && attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }

      console.warn(`Search API error: ${res.status}`);
      return [];
    } catch (error) {
      // Retry on network errors or timeouts
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
      console.warn("Search temporarily unavailable");
      return [];
    }
  }
  return [];
};

export default function Search() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [recommendVisible, setRecommendVisible] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Only fetch if query is at least 2 characters
    if (newValue.trim().length >= 2) {
      // Debounce API calls by 300ms
      debounceTimeoutRef.current = setTimeout(async () => {
        const results = await fetchBookTitles(
          newValue.trim().replace(/\s+/g, "+")
        );
        setRecommendations(results);
        setRecommendVisible(results.length > 0);
      }, 300);
    } else {
      setRecommendations([]);
      setRecommendVisible(false);
    }
  };

  const handleClick = useCallback(() => {
    const formatted = value.trim().replace(/\s+/g, "+");
    const searchKey = `/search?q=${formatted}&mode=everything`;
    setRecommendVisible(false);
    router.push(`${searchKey}`);
  }, [router, value]);

  const handleSelectRecommendation = (rec: string) => {
    setValue(rec);
    setRecommendVisible(false);
  };

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setValue("");
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
    };
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative flex items-center">
        <div className="absolute left-4 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
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
              handleClick();
            }
          }}
          onChange={handleChange}
          placeholder="Search for books, authors, or topics..."
          className="w-full pl-12 pr-24 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                     text-gray-900 placeholder-gray-400 transition-all duration-200
                     hover:bg-gray-100 focus:bg-white"
        />
        <button
          type="submit"
          onClick={handleClick}
          className="absolute right-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white 
                     rounded-lg font-medium text-sm transition-colors duration-200 
                     disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
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

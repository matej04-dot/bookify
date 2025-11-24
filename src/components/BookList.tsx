"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { useProjectsInfinite } from "../services/infiniteBookFetch";
import BookCardLarge from "./BookCardLarge";
import { useRouter } from "next/navigation";
import { baseUrl } from "@/utils/Constants";
import { useSearchParams } from "next/navigation";
import OrderBy from "./OrderBy";

const ProjectsListInfinite: React.FC = () => {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [order, setOrder] = useState<string>("relevance");

  const projectsUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("q", query ?? "");
    params.set("mode", "everything");
    if (order && order !== "relevance") params.set("sort", order);
    const u = `${baseUrl}/search.json?${params.toString()}`;
    console.log("useProjectsInfinite -> projectsUrl:", u);
    return u;
  }, [query, order]);

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProjectsInfinite(projectsUrl);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: "500px" }
    );

    const el = loadMoreRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const totalBooks =
    data?.pages.reduce((acc, page) => acc + page.data.length, 0) || 0;

  if (isLoading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mx-auto"></div>
            <svg
              className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <p className="mt-4 text-gray-600 font-medium">
            Searching for books...
          </p>
          <p className="text-sm text-gray-400 mt-1">This may take a moment</p>
        </div>
      </div>
    );

  if (isError)
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-8 w-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Something went wrong
          </h3>
          <p className="text-red-600">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );

  const hasNoResults = !data?.pages[0]?.data.length;

  if (hasNoResults)
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-10 w-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No books found
          </h3>
          <p className="text-gray-500 mb-4">
            We couldn&apos;t find any books matching &quot;{query}&quot;
          </p>
          <p className="text-sm text-gray-400">
            Try adjusting your search or check for typos
          </p>
        </div>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Search Results
            {query && (
              <span className="text-gray-500 font-normal">
                {" "}
                for &quot;{query}&quot;
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalBooks} book{totalBooks !== 1 ? "s" : ""} found
          </p>
        </div>
        <OrderBy value={order} onChange={setOrder} />
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {data?.pages.map((page, i) => (
          <React.Fragment key={i}>
            {page.data.map((book) => (
              <BookCardLarge
                key={book.id}
                book={book}
                onClick={() => {
                  if (book.key) {
                    const bookKey = book.key.replace("/works/", "");
                    router.push(`/bookDetails/${encodeURIComponent(bookKey)}`);
                  }
                }}
              />
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="h-10" />

      {/* Loading More Indicator */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 bg-blue-50 px-6 py-3 rounded-full">
            <div className="h-5 w-5 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin"></div>
            <p className="text-blue-600 font-medium">Loading more books...</p>
          </div>
        </div>
      )}

      {/* End of Results */}
      {!hasNextPage && totalBooks > 0 && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
            <svg
              className="h-4 w-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-gray-600 text-sm font-medium">
              You&apos;ve seen all {totalBooks} books
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsListInfinite;

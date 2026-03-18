"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { useProjectsInfinite } from "../services/infiniteBookFetch";
import BookCardLarge from "./BookCardLarge";
import { useRouter } from "next/navigation";
import { baseUrl } from "@/utils/Constants";
import { useSearchParams } from "next/navigation";
import OrderBy from "./OrderBy";
import { Spinner } from "./ui/spinner";
import { EmptyState } from "./ui/empty-state";

const ProjectsListInfinite: React.FC = () => {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const hasValidQuery = query.length >= 2;

  const [order, setOrder] = useState<string>("relevance");

  const projectsUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("q", query ?? "");
    params.set("mode", "everything");
    if (order && order !== "relevance") params.set("sort", order);
    return `${baseUrl}/search.json?${params.toString()}`;
  }, [query, order]);

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProjectsInfinite(projectsUrl, hasValidQuery);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (!hasValidQuery || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: "500px" },
    );

    const el = loadMoreRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasValidQuery, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!hasValidQuery) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <EmptyState
          title="Start with a search term"
          description="Enter at least 2 characters in the search bar to find books."
        />
      </div>
    );
  }

  const totalBooks =
    data?.pages.reduce((acc, page) => acc + page.data.length, 0) || 0;

  if (isLoading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Searching for books..." />
      </div>
    );

  if (isError)
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <EmptyState
          tone="danger"
          title="Something went wrong"
          description={error.message}
          icon={
            <svg
              className="h-8 w-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          }
          action={
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-red-600 px-6 py-2 text-white hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          }
        />
      </div>
    );

  const hasNoResults = !data?.pages[0]?.data.length;

  if (hasNoResults)
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <EmptyState
          title="No books found"
          description={`We couldn't find any books matching "${query}".`}
        />
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

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

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-3 text-gray-600">Loading books...</p>
        </div>
      </div>
    );

  if (isError)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 font-medium">Error: {error.message}</p>
        </div>
      </div>
    );

  console.log(data);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <OrderBy value={order} onChange={setOrder} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
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

      <div ref={loadMoreRef} className="h-10" />

      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-8">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mr-2"></div>
          <p className="text-gray-600">Loading more...</p>
        </div>
      )}

      {!hasNextPage && data?.pages[0]?.data.length > 0 && (
        <p className="text-center text-gray-500 py-8 text-sm">
          You&apos;ve reached the end
        </p>
      )}
    </div>
  );
};

export default ProjectsListInfinite;

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
    return <p className="text-center text-gray-500 py-8">Loading books...</p>;

  if (isError)
    return (
      <p className="text-center text-red-500 py-8">Error: {error.message}</p>
    );

  console.log(data);

  return (
    <>
      <OrderBy value={order} onChange={setOrder} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 p-3">
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
        <p className="text-center text-gray-500 py-4">Loading more...</p>
      )}

      {!hasNextPage && (
        <p className="text-center text-gray-400 py-4">No more books</p>
      )}
    </>
  );
};

export default ProjectsListInfinite;

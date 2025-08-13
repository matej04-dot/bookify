import React, { useRef, useEffect } from "react";
import { useProjectsInfinite } from "../services/infiniteBookFetch";
import BookCardLarge from "./BookCardLarge";
import { useNavigate } from "react-router-dom";
import { baseUrl } from "@/utils/Constants";
import { useSearchParams } from "react-router-dom";

const ProjectsListInfinite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProjectsInfinite(
    `${baseUrl}/search.json?q=${encodeURIComponent(query)}&mode=everything`
  );

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();

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
                    navigate(`/${bookKey}`);
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

"use client";

import { useQueries } from "@tanstack/react-query";
import { fetchData } from "../services/fetchBooks";
import type { BookData } from "../types/Types";
import BookCarouselRender from "./BookCarouselRender";
import { BOOK_URLS } from "@/utils/Constants";

function BookCategory() {
  const results = useQueries({
    queries: BOOK_URLS.map((url, index) => ({
      queryKey: ["book", index],
      queryFn: () => fetchData<BookData>(url),
    })),
  });

  const isLoading = results.some((result) => result.isLoading);
  const isError = results.some((result) => result.isError);

  if (isLoading) {
    return (
      <span className="text-gray-500 flex justify-center">
        Loading books...
      </span>
    );
  }

  if (isError) {
    return <span>Error</span>;
  }

  const fetchedBooks = results.map((result) => result.data);
  console.log(fetchedBooks);

  return fetchedBooks.map((item, index) => (
    <BookCarouselRender key={index} data={item === undefined ? null : item} />
  ));
}

export default BookCategory;

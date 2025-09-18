import BookList from "@/components/BookList";
import { Suspense } from "react";

function BooksList() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <p className="ml-1.5 mt-1.5 text-sm text-gray-600">
        Check each product page for more details
      </p>
      <BookList />
    </Suspense>
  );
}

export default BooksList;

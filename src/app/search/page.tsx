import BookList from "@/components/BookList";
import { Suspense } from "react";

// ISR za search stranice
export const revalidate = 1800; // 30 minuta

// Metadata za SEO
export const metadata = {
  title: "Search Books | Bookify",
  description:
    "Search and discover your next favorite book from our extensive collection",
};

function BooksList() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="bg-gray-200 rounded-lg aspect-[2/3]"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      >
        <BookList />
      </Suspense>
    </div>
  );
}

export default BooksList;

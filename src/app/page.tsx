import BookCategoryServer from "@/components/BookCategoryServer";

// ISR for home page
export const revalidate = 3600; // 1 sat

// Metadata
export const metadata = {
  title: "Bookify - Discover Your Next Favorite Book",
  description:
    "Browse and discover books from various categories. Find your next great read!",
};

function BooksList() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Featured Books
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Explore our curated collection of books across various categories
        </p>
      </div>
      <BookCategoryServer />
    </div>
  );
}

export default BooksList;

import BookCategory from "@/components/BookCategory";

function BooksList() {
  return (
    <div className="m-2">
      <p className="ml-1.5 mt-1.5 text-sm text-gray-600">
        Check each product page for more details
      </p>
      <BookCategory />
    </div>
  );
}

export default BooksList;

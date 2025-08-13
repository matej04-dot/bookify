import DefaultLayout from "@/components/layout/DefaultLayout";
import BookList from "@/components/BookList";

function BooksList() {
  return (
    <>
      <DefaultLayout>
        <p className="ml-1.5 mt-1.5 text-sm text-gray-600">
          Check each product page for more details
        </p>
        <BookList />
      </DefaultLayout>
    </>
  );
}

export default BooksList;

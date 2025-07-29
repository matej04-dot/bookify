import { useFetch } from "../services/api";
import Book from "./BookCardaLarge";

type BookData = {
  works: {
    key: string;
    title: string;
    authors: { name: string }[];
    cover_edition_key?: string;
  }[];
};

function BookList() {
  const { data, loading, error } = useFetch<BookData>(
    "https://openlibrary.org/subjects/fantasy.json?limit=5&offset=15"
  );

  if (loading)
    return (
      <p className="text-center text-gray-900 font-medium animate-pulse">
        Loading data...
      </p>
    );
  if (error) return <p>Error loading data: {error.message}</p>;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-4">
      {data?.works?.map((book: any) => (
        <Book key={book.key} book={book} />
      ))}
    </div>
  );
}

export default BookList;

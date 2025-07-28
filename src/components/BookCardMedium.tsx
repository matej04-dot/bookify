import Example from "./Rating";

type BookProps = {
  book: {
    title: string;
    authors?: { name: string }[];
    cover_edition_key?: string;
  };
};

const BookCardaMedium = ({ book }: BookProps) => {
  const coverUrl = book.cover_edition_key
    ? `https://covers.openlibrary.org/b/olid/${book.cover_edition_key}-M.jpg`
    : "/no-cover.jpg";

  return (
    <div className="flex flex-col items-center justify-between shadow-md border border-gray-200 rounded-lg hover:shadow-xl hover:border-blue-100 transition-shadow duration-300 w-full sm:w-40 sm:max-w-xs bg-white mx-auto h-full">
      <div className="bg-gray-100 rounded-t-lg flex-shrink-0 flex items-center justify-center w-full">
        <img
          src={coverUrl}
          className="rounded-t-lg h-36 sm:h-48 w-full object-cover m-2"
          alt={`Cover for ${book.title}`}
        />
      </div>
      <div className="w-full flex-grow p-2 sm:p-1 justify-around m-1.5 h-44 sm:h-48 flex flex-col">
        <p className="font-semibold text-gray-800 leading-snug text-base sm:text-sm line-clamp-2">
          {book.title}
        </p>
        <p className="text-sm text-gray-600 italic mb-1 line-clamp-1">
          by{" "}
          {book.authors?.map((author) => author.name).join(", ") ||
            "Unknown Author"}
        </p>
        <p className="text-sm font-medium text-gray-700">Rating 4.4</p>
        <Example />
        <p className="text-xs text-gray-500 line-clamp-2 mt-2">
          "Review: Battle of the Bookstores" is a charming ...
        </p>
      </div>
    </div>
  );
};

export default BookCardaMedium;

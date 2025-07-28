import Example from "./Rating";

type BookProps = {
  book: {
    title: string;
    authors?: { name: string }[];
    cover_edition_key?: string;
  };
};

const BookCardaLarge = ({ book }: BookProps) => {
  const coverUrl = book.cover_edition_key
    ? `https://covers.openlibrary.org/b/olid/${book.cover_edition_key}-M.jpg`
    : "/no-cover.jpg";
  return (
    <div className="flex items-center justify-between shadow-md border border-gray-200 rounded-lg hover:shadow-xl hover:border-blue-100 transition-shadow duration-300">
      <span className="bg-gray-100 rounded-l-lg flex-shrink-0">
        <img
          src={coverUrl}
          className="w-40 h-auto aspect-[2/3] object-cover rounded m-3"
        ></img>
      </span>
      <span className="w-60 flex-grow p-4">
        <p className="text-lg font-semibold text-gray-800 leading-snug mb-1">
          {book.title}
        </p>
        <p className="text-sm text-gray-600 italic mb-1">
          by{" "}
          {book.authors?.map((author) => author.name).join(", ") ||
            "Unknown Author"}
        </p>
        <p className="text-sm font-medium text-gray-700">Rating 4.4</p>
        <Example />
        <p className="text-xs text-gray-500 line-clamp-2">
          "Review: Battle of the Bookstores" is a charming and witty ...
        </p>
      </span>
    </div>
  );
};

export default BookCardaLarge;

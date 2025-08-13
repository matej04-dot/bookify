import { imagesBaseUrl } from "@/utils/Constants";
import Example from "./Rating";
import { useState } from "react";

type BookProps = {
  book: {
    key: string;
    title: string;
    authors?: { name: string }[];
    cover_edition_key?: string;
  };
  onClick?: () => void;
};

const BookCardaLarge = ({ book, onClick }: BookProps) => {
  const [loading, setLoading] = useState(true);
  const coverUrl = book.cover_edition_key
    ? `${imagesBaseUrl}/b/olid/${book.cover_edition_key}-M.jpg`
    : "/no-cover.jpg";
  return (
    <div
      onClick={onClick}
      className="flex rounded-lg shadow-md border border-gray-200 hover:shadow-xl hover:border-blue-100 transition-shadow duration-300 bg-white"
    >
      <div className="bg-gray-100 rounded-l-lg flex-shrink-0 flex items-center justify-center w-40 sm:w-48 p-3">
        {loading && (
          <div className="h-51 flex items-center justify-center">
            <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <img
          src={coverUrl}
          className={`rounded-lg h-36 sm:h-48 w-full object-cover m-3 ${
            loading ? "hidden" : "block"
          }`}
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
          alt={`Cover for ${book.title}`}
        />
      </div>
      <div className="w-full flex-grow p-2 sm:p-1 justify-around m-1.5 h-44 sm:h-48 flex flex-col">
        <p className="font-semibold text-gray-800 leading-snug text-base sm:text-sm md:text-lg line-clamp-2">
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

export default BookCardaLarge;

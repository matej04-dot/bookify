import { data, useParams } from "react-router-dom";
import { useFetch } from "../services/api";
import { useEffect, useState } from "react";
import authorsData from "../services/fetchAuthors";
import Example from "./Rating";

type BookDetailsProps = {
  covers?: number[];
  title?: string;
  description?: string | { value: string };
  authors?: {
    author: {
      key: string;
    };
  }[];
};

type AuthorDetailsProps = {
  name?: string;
  photos?: number[];
  biography?: string | { value: string };
  birth_date?: string;
  death_date?: string;
};

function BookDetails() {
  const { bookKey } = useParams<{ bookKey: string }>();
  const [loading, setLoading] = useState(true);
  const [authors, setAuthors] = useState<AuthorDetailsProps[]>([]);
  const [loadingAuthors, setLoadingAuthors] = useState(true);

  const {
    data: bookData,
    loading: loadingBook,
    error: errorBook,
  } = useFetch<BookDetailsProps>(
    `https://openlibrary.org/works/${bookKey}.json`
  );

  useEffect(() => {
    async function fetchAuthors() {
      if (!bookData?.authors) return;

      const authorKeys = bookData.authors.map((a) => a.author.key);
      try {
        const authorData = await authorsData(authorKeys);
        setAuthors(authorData);
      } catch (err) {
        console.error("Error fetching authors:", err);
      } finally {
        setLoadingAuthors(false);
      }
    }

    fetchAuthors();
  }, [bookData]);

  const coverId = bookData?.covers?.[0] ?? null;
  const bookCover = `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;

  if (loadingBook)
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  if (errorBook) return <div>Error loading book details</div>;
  if (!bookData) return <div>No book data found</div>;

  console.log(authors[0]);

  return (
    <>
      <div className="flex w-full items-center justify-center mt-10 p-5">
        <div className="w-1/4 flex items-center justify-center border-2 border-gray-300 rounded-lg overflow-hidden relative p-3 bg-gray-200">
          {loading && (
            <div className="h-64 bg-gray-100 flex items-center justify-center">
              <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <img
            src={bookCover}
            className={`w-full h-full object-cover ${
              loading ? "hidden" : "block"
            }`}
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          ></img>
        </div>
        <div className="w-3/4 pl-6">
          <div className="mb-2">
            <p className="text-3xl">{bookData.title}</p>
            <p className="text-lg text-gray-600 italic mb-1 line-clamp-1">
              by{" "}
              {authors.map((author) => author.name).join(", ") ||
                "Unknown Author"}
            </p>
            <Example />
          </div>
          {<hr></hr>}
          {typeof bookData.description === "string"
            ? bookData.description
            : bookData.description?.value}
        </div>
      </div>
      {authors[0] && (
        <div className="flex">
          <p>About the author</p>
          <div>
            {authors[0].photos?.[0] && (
              <img
                src={`https://covers.openlibrary.org/b/id/${authors[0].photos[0]}-M.jpg`}
              ></img>
            )}
            <p>{authors[0].name}</p>
            <p>Birth date: {authors[0].birth_date}</p>
            {authors[0]?.death_date && (
              <p>Death date: {authors[0].death_date}</p>
            )}
            <p>
              {typeof authors[0].biography === "string"
                ? authors[0].biography
                : authors[0].biography?.value}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default BookDetails;

import { data, useParams } from "react-router-dom";
import { useFetch } from "../services/api";
import { useEffect, useState } from "react";
import authorsData from "../services/fetchAuthors";
import Example from "./Rating";
import type { AuthorDetailsProps } from "@/types/Types";
import { baseUrl, imagesBaseUrl } from "@/utils/Constants";

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

function BookDetails() {
  const { bookKey } = useParams<{ bookKey: string }>();
  const [loading, setLoading] = useState(true);
  const [authors, setAuthors] = useState<AuthorDetailsProps[]>([]);
  const [loadingAuthors, setLoadingAuthors] = useState(true);

  const {
    data: bookData,
    loading: loadingBook,
    error: errorBook,
  } = useFetch<BookDetailsProps>(`${baseUrl}/works/${bookKey}.json`);

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

  console.log(bookData);
  console.log(authors[0]);

  const coverId = bookData?.covers?.[0] ?? null;
  const bookCover = `${imagesBaseUrl}/b/id/${coverId}-M.jpg`;

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
      <div className="md:flex sm:w-full items-center justify-center md:mt-10 p-5 lg:w-4/5 lg:mx-auto">
        <div className="sm:w-1/2 md:w-1/3 flex items-center justify-center border-2 border-yellow-400 bg-gray-200 rounded-lg shadow-lg relative p-3">
          {loading && (
            <div className="h-64 flex items-center justify-center">
              <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <img
            src={bookCover}
            className={`h-full object-cover ${loading ? "hidden" : "block"}`}
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          ></img>
        </div>
        <div className="md:w-3/4 md:pl-6 mt-3">
          <div className="mb-3">
            <p className="text-3xl">{bookData.title}</p>
            <p className="text-lg text-gray-600 italic mb-1 line-clamp-1">
              by{" "}
              {authors.map((author) => author.name).join(", ") ||
                "Unknown Author"}
            </p>
            <Example />
          </div>
          {<hr></hr>}
          <p className="mt-2 border border-gray-200 rounded-lg p-3 text-gray-900">
            {typeof bookData.description === "string"
              ? bookData.description
              : bookData.description?.value}
          </p>
        </div>
      </div>
      {<hr></hr>}
      {authors[0] && (
        <div className="items-center justify-center m-5 lg:w-4/5 lg:mx-auto">
          <p className="text-lg text-gray-600 italic mb-1 ml-2">
            About the author
          </p>
          <div className="md:flex border border-gray-100 rounded-lg p-3 bg-gray-200">
            <div className="md:w-1/4">
              {authors[0].photos?.[0] && (
                <img
                  src={`${imagesBaseUrl}/b/id/${authors[0].photos[0]}-M.jpg`}
                  className="rounded-lg shadow-lg w-auto"
                ></img>
              )}
              <div className="m-2 text-sm italic">
                <p>{authors[0].name}</p>
                <p>Birth date: {authors[0].birth_date}</p>
                {authors[0]?.death_date && (
                  <p>Death date: {authors[0].death_date}</p>
                )}
              </div>
            </div>
            <p className="bg-gray-50 text-gray-900 sm:mt-5 md:mt-0 md:ml-3 p-3 md:w-3/4 rounded-lg break-words">
              {typeof authors[0].bio === "string"
                ? authors[0].bio
                : authors[0].bio?.value}
            </p>
          </div>
        </div>
      )}
      {<hr></hr>}
      <div className="m-5 mt-8 lg:w-4/5 lg:mx-auto">
        <p className="text-lg text-gray-600 italic mb-1 ml-2">Reviews</p>
        <p className="italic text-gray-500 border-2 p-3 rounded-lg">
          Pero Peric: Contrary to popular belief, Lorem Ipsum is not simply
          random text. It has roots in a piece of classical Latin literature
          from 45 BC, making it over 2000 years old. Richard McClintock, a Latin
          professor at Hampden-Sydney College in Virginia, looked up one of the
          more obscure Latin words, consectetur, from a Lorem Ipsum passage, and
          going through the cites of the word in classical literature,
          discovered the undoubtable source. Lorem Ipsum comes from sections
          1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes
          of Good and Evil) by Cicero, written in 45 BC. This book is a treatise
          on the theory of ethics, very popular during the Renaissance. The
          first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from
          a line in section 1.10.32.
          {<br></br>}
          {<br></br>}
          Marko Maric: Hampden-Sydney College in Virginia, looked up one of the
          more obscure Latin words, consectetur, from a Lorem Ipsum passage, and
          going through the cites of the word in classical literature,
          discovered the undoubtable source. Lorem Ipsum comes from sections
          1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes
          of Good and Evil) by Cicero
          {<br></br>}
          {<br></br>}
          Marko Maric: Hampden-Sydney College in Virginia, looked up one of the
          more obscure Latin words, consectetur, from a Lorem Ipsum passage, and
          going through the cites of the word in classical literature,
          discovered the undoubtable source. Lorem Ipsum comes from sections
          1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes
          of Good and Evil) by Cicero
        </p>
      </div>
    </>
  );
}

export default BookDetails;

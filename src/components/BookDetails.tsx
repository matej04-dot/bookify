import type { AuthorDetailsProps } from "@/types/Types";
import { imagesBaseUrl } from "@/utils/Constants";
import ReviewsList from "./ReviewsList";
import BookDetailsClient from "./BookDetailsClient";
import BookRating from "./BookRating";
import Image from "next/image";

type BookDetailsProps = {
  bookKey: string;
  bookData: {
    covers?: number[];
    title?: string;
    description?: string | { value: string };
    authors?: { author: { key: string } }[];
  } | null;
  authors: AuthorDetailsProps[];
};

export default function BookDetails({
  bookKey,
  bookData,
  authors,
}: BookDetailsProps) {
  const coverId = bookData?.covers?.[0];
  const bookCover = coverId
    ? `${imagesBaseUrl}/b/id/${coverId}-M.jpg`
    : undefined;

  if (!bookData) return <div>No book data found</div>;

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Book Cover */}
          <div className="flex-shrink-0 flex justify-center md:justify-start">
            <div className="relative group w-48 md:w-56">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl blur opacity-20 group-hover:opacity-35 transition duration-300"></div>
              <div className="relative bg-white rounded-xl shadow-lg p-3 transition-transform duration-300 hover:scale-[1.02]">
                {bookCover ? (
                  <Image
                    src={bookCover}
                    width={200}
                    height={300}
                    className="w-full h-auto object-cover rounded-lg aspect-[2/3]"
                    alt={bookData.title || "Book cover"}
                    priority
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400">
                    <svg
                      className="w-12 h-12 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    <span className="text-sm">No cover</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Book Details */}
          <div className="flex-1 space-y-5">
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              {bookData.title}
            </h1>

            {/* Authors */}
            <div className="flex items-center gap-2 text-base text-gray-600">
              <svg
                className="w-5 h-5 text-blue-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="font-medium">
                {authors.length > 0
                  ? authors.map((author) => author.name).join(", ")
                  : "Unknown Author"}
              </span>
            </div>

            {/* Rating */}
            <BookRating bookKey={bookKey} />

            {/* Description */}
            <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                About this book
              </h2>
              <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                {typeof bookData.description === "string"
                  ? bookData.description
                  : bookData.description?.value || "No description available."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* About the Author */}
      {authors[0] && (
        <div className="container mx-auto px-4 mt-10 max-w-6xl">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
            About the Author
          </h2>
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-5 p-5 sm:p-6">
              {/* Author Photo & Info */}
              <div className="flex-shrink-0 flex flex-col items-center sm:items-start">
                {authors[0].photos?.[0] ? (
                  <div className="relative group w-24 sm:w-28">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg blur opacity-20 group-hover:opacity-35 transition duration-300"></div>
                    <img
                      src={`${imagesBaseUrl}/b/id/${authors[0].photos[0]}-M.jpg`}
                      className="relative rounded-lg shadow-md w-full h-auto"
                      alt={authors[0].name}
                    />
                  </div>
                ) : (
                  <div className="w-24 sm:w-28 aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                    <svg
                      className="w-10 h-10"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
                <div className="mt-3 text-center sm:text-left">
                  <p className="font-bold text-base text-gray-900">
                    {authors[0].name}
                  </p>
                  {authors[0].birth_date && (
                    <p className="text-xs text-gray-500 mt-1">
                      Born: {authors[0].birth_date}
                    </p>
                  )}
                  {authors[0]?.death_date && (
                    <p className="text-xs text-gray-500">
                      Died: {authors[0].death_date}
                    </p>
                  )}
                </div>
              </div>

              {/* Author Bio */}
              <div className="flex-1 min-w-0">
                <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-lg border border-blue-100 h-full">
                  <p className="text-gray-700 leading-relaxed text-sm">
                    {typeof authors[0].bio === "string"
                      ? authors[0].bio
                      : authors[0].bio?.value || "No biography available."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="container mx-auto px-4 mt-10 mb-10 max-w-6xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
            Reviews
          </h2>
        </div>
        <BookDetailsClient bookKey={bookKey} bookName={bookData.title} />
        <ReviewsList bookId={bookKey.replace(/^\/?works\//i, "")} />
      </div>
    </>
  );
}

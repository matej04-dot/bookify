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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Cover */}
          <div className="lg:col-span-1 flex justify-center lg:justify-start">
            <div className="relative group w-full max-w-sm">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-white rounded-2xl shadow-xl p-4 transition-transform duration-300 hover:scale-[1.02]">
                {bookCover && (
                  <Image
                    src={bookCover}
                    width={200}
                    height={300}
                    className="w-full h-auto object-cover rounded-xl aspect-[2/3]"
                    alt={bookData.title || "Book cover"}
                    priority
                  />
                )}
              </div>
            </div>
          </div>

          {/* Book Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              {bookData.title}
            </h1>

            {/* Authors */}
            <div className="flex items-center gap-2 text-lg text-gray-600">
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
            <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-blue-600"
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
              <p className="text-gray-700 leading-relaxed text-base">
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
        <div className="container mx-auto px-4 mt-12 max-w-7xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
            About the Author
          </h2>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 md:p-8">
              <div className="md:col-span-1">
                {authors[0].photos?.[0] && (
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                    <img
                      src={`${imagesBaseUrl}/b/id/${authors[0].photos[0]}-M.jpg`}
                      className="relative rounded-xl shadow-lg w-full h-auto"
                      alt={authors[0].name}
                    />
                  </div>
                )}
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p className="font-bold text-lg text-gray-900">
                    {authors[0].name}
                  </p>
                  {authors[0].birth_date && (
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Born: {authors[0].birth_date}</span>
                    </div>
                  )}
                  {authors[0]?.death_date && (
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <span>Died: {authors[0].death_date}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-3">
                <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100">
                  <p className="text-gray-700 leading-relaxed text-base">
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
      <div className="container mx-auto px-4 mt-12 mb-12 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
            Reviews
          </h2>
        </div>
        <BookDetailsClient bookKey={bookKey} bookName={bookData.title} />
        <ReviewsList bookId={bookKey.replace(/^\/?works\//i, "")} />
      </div>
    </>
  );
}

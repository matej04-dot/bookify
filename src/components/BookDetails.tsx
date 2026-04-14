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

  if (!bookData)
    return (
      <div className="px-4 py-10 text-center text-muted-foreground">
        No book data found
      </div>
    );

  return (
    <>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0 flex justify-center md:justify-start">
            <div className="w-48 md:w-56">
              <div className="rounded-2xl border border-border bg-card p-3 shadow-sm transition hover:shadow-md">
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
                  <div className="flex aspect-[2/3] w-full flex-col items-center justify-center rounded-lg bg-muted text-muted-foreground">
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

          <div className="flex-1 space-y-5">
            <h1 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl lg:text-4xl">
              {bookData.title}
            </h1>

            <div className="flex items-center gap-2 text-base text-muted-foreground">
              <svg
                className="h-5 w-5 flex-shrink-0 text-primary"
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

            <BookRating bookKey={bookKey} />

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-foreground">
                <svg
                  className="h-5 w-5 text-primary"
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
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {typeof bookData.description === "string"
                  ? bookData.description
                  : bookData.description?.value || "No description available."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {authors[0] && (
        <div className="container mx-auto mt-10 max-w-6xl px-4">
          <h2 className="mb-4 flex items-center gap-3 text-xl font-semibold text-foreground sm:text-2xl">
            <div className="h-6 w-1 rounded-full bg-primary/70"></div>
            About the Author
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex flex-col sm:flex-row gap-5 p-5 sm:p-6">
              <div className="flex-shrink-0 flex flex-col items-center sm:items-start">
                {authors[0].photos?.[0] ? (
                  <div className="w-24 sm:w-28">
                    <Image
                      src={`${imagesBaseUrl}/b/id/${authors[0].photos[0]}-M.jpg`}
                      width={112}
                      height={112}
                      className="h-auto w-full rounded-lg border border-border"
                      alt={authors[0].name}
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square w-24 items-center justify-center rounded-lg bg-muted text-muted-foreground sm:w-28">
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
                  <p className="text-base font-semibold text-foreground">
                    {authors[0].name}
                  </p>
                  {authors[0].birth_date && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Born: {authors[0].birth_date}
                    </p>
                  )}
                  {authors[0]?.death_date && (
                    <p className="text-xs text-muted-foreground">
                      Died: {authors[0].death_date}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="h-full rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
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

      <div className="container mx-auto mt-10 mb-10 max-w-6xl px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-3 text-xl font-semibold text-foreground sm:text-2xl">
            <div className="h-6 w-1 rounded-full bg-primary/70"></div>
            Reviews
          </h2>
        </div>
        <BookDetailsClient
          bookKey={bookKey}
          bookName={bookData.title}
          authors={authors.map((author) => author.name ?? "").filter(Boolean)}
          coverEditionKey={coverId ? String(coverId) : null}
        />
        <ReviewsList bookId={bookKey.replace(/^\/?works\//i, "")} />
      </div>
    </>
  );
}

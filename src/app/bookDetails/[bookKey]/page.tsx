import BookDetails from "@/components/BookDetails";
import authorsData from "@/services/fetchAuthors";
import { baseUrl } from "@/utils/Constants";
import type { AuthorDetailsProps } from "@/types/Types";

export const runtime = "nodejs";
export const revalidate = 3600; // Cache for 1 hour

type BookData = {
  covers?: number[];
  title?: string;
  description?: string | { value: string };
  authors?: { author: { key: string } }[];
};

async function fetchBookData(
  bookKey: string,
  retries = 3
): Promise<BookData | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(`${baseUrl}/works/${bookKey}.json`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
        headers: {
          "User-Agent": "book-app/1.0",
        },
      });

      if (res.ok) {
        return res.json();
      }

      // If it's a 503 or 429, retry after delay
      if (res.status === 503 || res.status === 429) {
        console.warn(
          `API temporarily unavailable (${res.status}), attempt ${
            attempt + 1
          }/${retries}`
        );
        if (attempt < retries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (attempt + 1))
          );
          continue;
        }
      }

      console.error("Fetch error:", res.status, res.statusText);
      return null;
    } catch (err) {
      console.error(`Fetch failed (attempt ${attempt + 1}/${retries}):`, err);
      if (attempt < retries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1))
        );
      }
    }
  }
  return null;
}

interface BookDetailPageProps {
  params: Promise<{ bookKey: string }>;
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { bookKey } = await params;

  const bookData = await fetchBookData(bookKey);

  if (!bookData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <svg
              className="w-24 h-24 mx-auto text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Book Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            We couldn't load the details for this book. The service might be
            temporarily unavailable.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white 
                       rounded-xl font-semibold shadow-lg hover:shadow-xl 
                       transition-all duration-200 hover:scale-105"
            >
              Try Again
            </button>
            <a
              href="/"
              className="px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 
                       rounded-xl font-semibold shadow-lg hover:shadow-xl 
                       transition-all duration-200 hover:scale-105"
            >
              Go Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  let authors: AuthorDetailsProps[] = [];
  if (bookData.authors) {
    const authorKeys = bookData.authors.map((a) => a.author.key);
    try {
      authors = await authorsData(authorKeys);
    } catch (err) {
      console.error("Authors fetch failed:", err);
    }
  }

  return (
    <BookDetails bookKey={bookKey} bookData={bookData} authors={authors} />
  );
}

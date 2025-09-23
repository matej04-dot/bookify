import BookDetails from "@/components/BookDetails";
import authorsData from "@/services/fetchAuthors";
import { baseUrl } from "@/utils/Constants";
import type { AuthorDetailsProps } from "@/types/Types";

export const runtime = "nodejs";

type BookData = {
  covers?: number[];
  title?: string;
  description?: string | { value: string };
  authors?: { author: { key: string } }[];
};

async function fetchBookData(bookKey: string): Promise<BookData | null> {
  try {
    const res = await fetch(`${baseUrl}/works/${bookKey}.json`, {
      cache: "no-store",
      headers: {
        "User-Agent": "book-app/1.0",
      },
    });

    if (!res.ok) {
      console.error("Fetch error:", res.status, res.statusText);
      return null;
    }

    return res.json();
  } catch (err) {
    console.error("Fetch failed:", err);
    return null;
  }
}

interface BookDetailPageProps {
  params: Promise<{ bookKey: string }>;
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { bookKey } = await params;

  const bookData = await fetchBookData(bookKey);

  if (!bookData) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-semibold">Book not found</h1>
        <p className="text-gray-500 mt-2">
          We couldn't load details for this book.
        </p>
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
    <BookDetails
      bookKey={bookKey}
      bookData={bookData}
      authors={authors}
      average={0}
    />
  );
}

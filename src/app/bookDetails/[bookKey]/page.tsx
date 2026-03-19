import BookDetails from "@/components/BookDetails";
import BookNotFound from "@/components/BookNotFound";
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
  retries = 3,
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
        if (attempt < retries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (attempt + 1)),
          );
          continue;
        }
      }

      return null;
    } catch {
      if (attempt < retries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1)),
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
    return <BookNotFound />;
  }

  let authors: AuthorDetailsProps[] = [];
  if (bookData.authors) {
    const authorKeys = bookData.authors.map((a) => a.author.key);
    try {
      authors = await authorsData(authorKeys);
    } catch {}
  }

  return (
    <BookDetails bookKey={bookKey} bookData={bookData} authors={authors} />
  );
}

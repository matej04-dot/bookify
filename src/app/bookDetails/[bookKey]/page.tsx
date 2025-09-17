import BookDetails from "@/components/BookDetails";
import authorsData from "@/services/fetchAuthors";
import { baseUrl } from "@/utils/Constants";
import type { AuthorDetailsProps } from "@/types/Types";

type BookData = {
  covers?: number[];
  title?: string;
  description?: string | { value: string };
  authors?: { author: { key: string } }[];
};

async function fetchBookData(bookKey: string): Promise<BookData | null> {
  const res = await fetch(`${baseUrl}/works/${bookKey}.json`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function BookDetailPage({
  params,
}: {
  params: { bookKey: string };
}) {
  const { bookKey } = await params;
  const bookData = await fetchBookData(bookKey);

  let authors: AuthorDetailsProps[] = [];
  if (bookData?.authors) {
    const authorKeys = bookData.authors.map((a) => a.author.key);
    authors = await authorsData(authorKeys);
  }

  return (
    <BookDetails bookKey={bookKey} bookData={bookData} authors={authors} />
  );
}

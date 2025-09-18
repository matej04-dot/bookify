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

interface BookDetailPageProps {
  params: { bookKey: string };
  bookData: BookData | null;
  authors: AuthorDetailsProps[];
}

export async function getServerSideProps(context: {
  params: { bookKey: string };
}) {
  const { bookKey } = context.params;
  const bookData = await fetchBookData(bookKey);

  let authors: AuthorDetailsProps[] = [];
  if (bookData?.authors) {
    const authorKeys = bookData.authors.map((a) => a.author.key);
    authors = await authorsData(authorKeys);
  }

  return {
    props: {
      params: { bookKey },
      bookData,
      authors,
    },
  };
}

export default function BookDetailPage({
  params,
  bookData,
  authors,
}: BookDetailPageProps) {
  return (
    <BookDetails
      bookKey={params.bookKey}
      bookData={bookData}
      authors={authors}
    />
  );
}

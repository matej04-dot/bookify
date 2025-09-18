export type AuthorDetailsProps = {
  name?: string;
  photos?: number[];
  bio?: string | { value: string };
  birth_date?: string;
  death_date?: string;
};

export type BookData = {
  name: string;
  works: {
    key: string;
    title: string;
    authors: { name: string }[];
    cover_edition_key?: string;
  }[];
};

export interface Review {
  id: string;
  userId: string;
  username: string;
  bookId: string;
  bookName: string | null;
  rating: number;
  comment: string;
  createdAt: any;
  updatedAt: any;
}

export interface PageProps<TParams = Record<string, string>> {
  params: TParams;
  searchParams?: Record<string, string | string[] | undefined>;
}

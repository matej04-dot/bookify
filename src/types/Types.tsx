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
    ratingAverage?: number | null;
    ratingReviewCount?: number | null;
    ratingResolved?: boolean;
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

export type AdminStatsItem = {
  key: string;
  label: string;
  reviewCount: number;
};

export interface AdminDashboardStats {
  totalReviews: number | null;
  globalAverageRating: number | null;
  reviewsLast24h: number | null;
  topBooksByReviewCount: AdminStatsItem[];
  topUsersByReviewCount: AdminStatsItem[];
}

export interface WishlistItem {
  id: string;
  userID: string;
  bookID: string;
  bookName: string;
  authors: string[];
  coverEditionKey: string | null;
  addedAt: any;
}

export type WishlistPayload = {
  bookID: string;
  bookName: string;
  authors: string[];
  coverEditionKey?: string | null;
};

import ReviewItem from "./ReviewItem";
import type { Review } from "../types/Types";

interface ReviewListProps {
  bookId?: string;
}

export default async function ReviewsList({ bookId }: ReviewListProps) {
  if (!bookId) {
    return (
      <div className="text-center text-gray-500 m-2">No reviews found</div>
    );
  }

  const baseUrl =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      : "";

  try {
    const res = await fetch(
      `${baseUrl}/api/reviews/${encodeURIComponent(bookId)}`,
      {
        next: { revalidate: 300 }, // 5 minuta cache za reviews
      }
    );
    if (!res.ok) {
      throw new Error("Failed to fetch reviews");
    }
    const reviews: Review[] = await res.json();

    return (
      <div className="rounded-lg border mt-2 p-3 md:p-0 border-gray-200">
        {reviews.length === 0 ? (
          <div className="text-center text-gray-500 m-2">No reviews found</div>
        ) : (
          reviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))
        )}
      </div>
    );
  } catch (err) {
    return (
      <div className="text-red-500">
        Error loading reviews: {(err as Error).message}
      </div>
    );
  }
}

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

  try {
    // Next.js 15 server component fetch mora imati apsolutni URL!
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const res = await fetch(
      `${baseUrl}/api/reviews/${encodeURIComponent(bookId)}`,
      { cache: "no-store" }
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

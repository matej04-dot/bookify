import { fetchData } from "../services/fetchBooks";
import type { BookData } from "../types/Types";
import BookCarouselRender from "./BookCarouselRender";
import { BOOK_URLS } from "@/utils/Constants";

async function BookCategoryServer() {
  const fetchPromises = BOOK_URLS.map((url) => fetchData<BookData>(url));
  const settled = await Promise.allSettled(fetchPromises);

  const successful = settled
    .map((item, index) => ({ item, index }))
    .filter(
      (
        entry
      ): entry is {
        item: PromiseFulfilledResult<BookData>;
        index: number;
      } => entry.item.status === "fulfilled"
    )
    .map((entry) => ({
      data: entry.item.value,
      index: entry.index,
    }));

  const failedCount = settled.length - successful.length;

  if (successful.length === 0) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
        We could not load book categories right now. Please refresh and try again.
      </div>
    );
  }

  return (
    <>
      {failedCount > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          Some categories are temporarily unavailable ({failedCount} failed).
        </div>
      )}
      {successful.map(({ data, index }) => (
        <BookCarouselRender key={index} data={data || null} />
      ))}
    </>
  );
}

export default BookCategoryServer;

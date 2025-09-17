import { fetchData } from "../services/fetchBooks";
import type { BookData } from "../types/Types";
import BookCarouselRender from "./BookCarouselRender";
import { BOOK_URLS } from "@/utils/Constants";

async function BookCategoryServer() {
  try {
    const fetchPromises = BOOK_URLS.map((url) => fetchData<BookData>(url));
    const fetchedBooks = await Promise.all(fetchPromises);

    return (
      <>
        {fetchedBooks.map((item, index) => (
          <BookCarouselRender key={index} data={item || null} />
        ))}
      </>
    );
  } catch (error) {
    console.error("Error fetching books:", error);
    return <span className="text-red-500">Error loading books</span>;
  }
}

export default BookCategoryServer;

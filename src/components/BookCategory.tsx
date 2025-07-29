import { useFetch } from "../services/api";
import BookCardaMedium from "./BookCardMedium";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useNavigate } from "react-router-dom";

type BookData = {
  works: {
    key: string;
    title: string;
    authors: { name: string }[];
    cover_edition_key?: string;
  }[];
};

function BookList() {
  const {
    data: fantasyData,
    loading: loadingFantasy,
    error: errorFantasy,
  } = useFetch<BookData>(
    "https://openlibrary.org/subjects/fantasy.json?limit=10&offset=0"
  );
  const {
    data: scifiData,
    loading: loadingScifi,
    error: errorScifi,
  } = useFetch<BookData>(
    "https://openlibrary.org/subjects/science_fiction.json?limit=10&offset=1"
  );
  const {
    data: romanceData,
    loading: loadingRomance,
    error: errorRomance,
  } = useFetch<BookData>(
    "https://openlibrary.org/subjects/romance.json?limit=10&offset=0"
  );
  const {
    data: thrillerData,
    loading: loadingThriller,
    error: errorThriller,
  } = useFetch<BookData>(
    "https://openlibrary.org/subjects/thriller.json?limit=10&offset=0"
  );
  const {
    data: scienceData,
    loading: loadingScience,
    error: errorScience,
  } = useFetch<BookData>(
    "https://openlibrary.org/subjects/science.json?limit=10&offset=0"
  );

  const navigate = useNavigate();

  const renderBookCarousel = (
    data: BookData | null,
    loading: boolean,
    error: Error | null,
    title: string
  ) => {
    if (loading) {
      return (
        <p className="text-center text-gray-900 font-medium animate-pulse mt-5">
          Loading {title} books...
        </p>
      );
    }
    if (error) {
      return (
        <p className="text-red-500 mt-5">
          Error loading {title} books: {error.message}
        </p>
      );
    }
    if (!data || !data.works || data.works.length === 0) {
      return (
        <p className="text-center text-gray-900 font-medium mt-5">
          No {title} books found
        </p>
      );
    }

    const booksToDisplay = data.works.slice(0, 10);

    return (
      <div className="my-5">
        <p className="text-xl font-bold text-gray-900 mb-4 ml-5">
          {title} Books:
        </p>
        <Carousel
          opts={{
            align: "start",
          }}
          className="w-full md:max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto my-4"
        >
          <CarouselContent className="-ml-4">
            {booksToDisplay.map((book, index) => (
              <CarouselItem
                onClick={() => {
                  if (book.key) {
                    const bookKey = book.key.replace("/works/", "");
                    navigate(`${bookKey}`);
                  }
                }}
                key={book.key || index}
                className="pl-4 basis-[40%] sm:basis-[28.57%] lg:basis-[22.22%] xl:basis-[15.38%]"
              >
                <BookCardaMedium book={book} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </div>
    );
  };

  return (
    <div>
      {renderBookCarousel(fantasyData, loadingFantasy, errorFantasy, "Fantasy")}
      {renderBookCarousel(
        scifiData,
        loadingScifi,
        errorScifi,
        "Science Fiction"
      )}
      {renderBookCarousel(romanceData, loadingRomance, errorRomance, "Romance")}
      {renderBookCarousel(
        thrillerData,
        loadingThriller,
        errorThriller,
        "Thriller"
      )}
      {renderBookCarousel(scienceData, loadingScience, errorScience, "Science")}
    </div>
  );
}

export default BookList;

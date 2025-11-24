"use client";

import BookCardaMedium from "./BookCardMedium";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useRouter } from "next/navigation";
import type { BookData } from "@/types/Types";

function BookCarouselRender({ data }: { data: BookData | null }) {
  const router = useRouter();

  if (!data || !data.works || data.works.length === 0) {
    return (
      <p className="text-center text-gray-900 font-medium mt-5">
        No books found
      </p>
    );
  }

  const booksToDisplay = data.works.slice(0, 10);

  return (
    <div className="my-5">
      <p className="text-xl font-bold title-case text-gray-900 mb-4 ml-5 lg:ml-20">
        {data.name} Books:
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
                  router.push(`bookDetails/${bookKey}`);
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
}

export default BookCarouselRender;

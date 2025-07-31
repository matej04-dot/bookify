import DefaultLayout from "@/components/layout/DefaultLayout";
import BookCategory from "../components/BookCategory";

export default function Home() {
  return (
    <DefaultLayout>
      <p className="ml-1.5 mt-1.5 text-sm text-gray-600">
        Check each product page for more details
      </p>
      <div className="container mx-auto px-2">
        <BookCategory />
      </div>
    </DefaultLayout>
  );
}

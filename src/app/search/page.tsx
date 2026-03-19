import SearchPageClient from "./search-client";

// Mark as dynamic to skip prerendering - /search page uses client-side hooks
export const dynamic = "force-dynamic";

// ISR za search stranice
export const revalidate = 1800; // 30 minuta

// Metadata za SEO
export const metadata = {
  title: "Search Books | Bookify",
  description:
    "Search and discover your next favorite book from our extensive collection",
};

export default function SearchPage() {
  return <SearchPageClient />;
}

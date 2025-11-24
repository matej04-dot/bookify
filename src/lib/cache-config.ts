// Cache strategije za različite tipove podataka

export const CACHE_REVALIDATION = {
  // Statički podaci - rijetko se mijenjaju
  AUTHORS: 86400, // 24 sata
  BOOK_DETAILS: 3600, // 1 sat

  // Dinamički podaci - često se ažuriraju
  REVIEWS: 300, // 5 minuta
  USER_DATA: 60, // 1 minuta
  SEARCH_RESULTS: 1800, // 30 minuta

  // Liste i katalozi
  BOOK_LISTS: 3600, // 1 sat
  CATEGORIES: 7200, // 2 sata

  // Real-time podaci
  RATINGS: 60, // 1 minuta
} as const;

// Helper funkcija za cache tagove
export function getCacheTag(type: string, id?: string) {
  return id ? `${type}-${id}` : type;
}

// Fetch wrapper sa automatskim cache-om
export async function cachedFetch<T>(
  url: string,
  revalidate: number = CACHE_REVALIDATION.BOOK_DETAILS,
  tags?: string[]
): Promise<T> {
  const options: RequestInit = {
    next: {
      revalidate,
      tags: tags || [],
    },
    headers: {
      "User-Agent": "book-app/1.0",
    },
  };

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

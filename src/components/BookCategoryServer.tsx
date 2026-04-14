import { fetchData } from "../services/fetchBooks";
import type { BookData } from "../types/Types";
import BookCarouselRender from "./BookCarouselRender";
import { BOOK_URLS } from "@/utils/Constants";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { unstable_cache } from "next/cache";

type RatingSummary = {
  ratingAverage: number | null;
  ratingReviewCount: number | null;
  ratingResolved: true;
};

const HOME_RATING_CACHE_SECONDS = 3600;

const normalizeBookKey = (bookKey: string) =>
  (bookKey || "").replace(/^\/?works\//i, "").trim();

const getRatingsForBookIds = async (
  bookIds: string[],
): Promise<Record<string, RatingSummary>> => {
  const uniqueBookIds = Array.from(
    new Set(bookIds.map(normalizeBookKey).filter(Boolean)),
  );

  if (uniqueBookIds.length === 0) {
    return {};
  }

  const firebaseAdmin = getFirebaseAdmin();
  const db = firebaseAdmin.firestore();

  const snapshots = await Promise.all(
    uniqueBookIds.map((bookId) =>
      db.collection("bookAvgRating").doc(bookId).get(),
    ),
  );

  return snapshots.reduce<Record<string, RatingSummary>>((acc, snapshot) => {
    if (!snapshot.exists) {
      return acc;
    }

    const data = snapshot.data() || {};
    const total = Number(data.total ?? 0);
    const count = Number(data.count ?? 0);
    const average = count > 0 ? Math.round((total / count) * 10) / 10 : null;

    acc[snapshot.id] = {
      ratingAverage: average,
      ratingReviewCount: count,
      ratingResolved: true,
    };

    return acc;
  }, {});
};

const getRatingsForBookIdsCached = async (bookIds: string[]) => {
  const uniqueBookIds = Array.from(
    new Set(bookIds.map(normalizeBookKey).filter(Boolean)),
  ).sort();

  if (uniqueBookIds.length === 0) {
    return {} as Record<string, RatingSummary>;
  }

  return unstable_cache(
    () => getRatingsForBookIds(uniqueBookIds),
    ["home-book-ratings", ...uniqueBookIds],
    { revalidate: HOME_RATING_CACHE_SECONDS },
  )();
};

const enrichAndSortWorks = async (works: BookData["works"]) => {
  const bookIds = works
    .map((work) => normalizeBookKey(work.key))
    .filter(Boolean);

  let ratingByBookId: Record<string, RatingSummary> = {};
  try {
    ratingByBookId = await getRatingsForBookIdsCached(bookIds);
  } catch {
    ratingByBookId = {};
  }

  const withIndex = works.map((work, index) => {
    const normalizedBookId = normalizeBookKey(work.key);
    const ratingSummary = ratingByBookId[normalizedBookId];

    if (ratingSummary) {
      return {
        index,
        work: {
          ...work,
          ...ratingSummary,
        },
      };
    }

    return {
      index,
      work: {
        ...work,
        ratingAverage: null,
        ratingReviewCount: null,
        ratingResolved: true,
      },
    };
  });

  withIndex.sort((a, b) => {
    const aHasRating = typeof a.work.ratingAverage === "number";
    const bHasRating = typeof b.work.ratingAverage === "number";

    if (aHasRating !== bHasRating) {
      return aHasRating ? -1 : 1;
    }

    if (
      aHasRating &&
      bHasRating &&
      a.work.ratingAverage !== b.work.ratingAverage
    ) {
      return (b.work.ratingAverage ?? 0) - (a.work.ratingAverage ?? 0);
    }

    const aReviewCount = a.work.ratingReviewCount ?? 0;
    const bReviewCount = b.work.ratingReviewCount ?? 0;

    if (aHasRating && bHasRating && aReviewCount !== bReviewCount) {
      return bReviewCount - aReviewCount;
    }

    return a.index - b.index;
  });

  return withIndex.map((item) => item.work);
};

async function BookCategoryServer() {
  const fetchPromises = BOOK_URLS.map((url) => fetchData<BookData>(url));
  const settled = await Promise.allSettled(fetchPromises);

  const successful = settled
    .map((item, index) => ({ item, index }))
    .filter(
      (
        entry,
      ): entry is {
        item: PromiseFulfilledResult<BookData>;
        index: number;
      } => entry.item.status === "fulfilled",
    )
    .map((entry) => ({
      data: entry.item.value,
      index: entry.index,
    }));

  const failedCount = settled.length - successful.length;

  const successfulWithRatings = await Promise.all(
    successful.map(async ({ data, index }) => {
      const sortedWorks = await enrichAndSortWorks(data?.works ?? []);

      return {
        index,
        data: {
          ...data,
          works: sortedWorks,
        },
      };
    }),
  );

  if (successful.length === 0) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
        We could not load book categories right now. Please refresh and try
        again.
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
      {successfulWithRatings.map(({ data, index }) => (
        <BookCarouselRender key={index} data={data || null} />
      ))}
    </>
  );
}

export default BookCategoryServer;

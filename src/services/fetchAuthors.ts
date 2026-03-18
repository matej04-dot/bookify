import type { AuthorDetailsProps } from "@/types/Types";
import { baseUrl } from "@/utils/Constants";

async function authorsData(
  authorsKeys: string[],
): Promise<AuthorDetailsProps[]> {
  const responses = await Promise.allSettled(
    authorsKeys.map((item) =>
      fetch(`${baseUrl}${item}.json`, {
        next: { revalidate: 86400 }, // Cache za 24 sata - autori se rijetko mijenjaju
        headers: {
          "User-Agent": "book-app/1.0",
        },
      }),
    ),
  );

  const successfulResponses = responses
    .filter(
      (entry): entry is PromiseFulfilledResult<Response> =>
        entry.status === "fulfilled",
    )
    .map((entry) => entry.value)
    .filter((res) => res.ok);

  const authors = await Promise.all(
    successfulResponses.map(async (res) => {
      const item = await res.json();
      return item as AuthorDetailsProps;
    }),
  );

  return authors;
}

export default authorsData;

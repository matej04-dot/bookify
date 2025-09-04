import type { AuthorDetailsProps } from "@/types/Types";
import { baseUrl } from "@/utils/Constants";

async function authorsData(
    authorsKeys: string[]
  ): Promise<AuthorDetailsProps[]> {

    const responses = await Promise.all(
      authorsKeys.map((item) => fetch(`${baseUrl}${item}.json`))
    );

    const authors = await Promise.all(
      responses.map(async (res) => {
        if (!res.ok) throw new Error("Fetch failed");
        const item = await res.json();
        return item;
      })
    );

    return authors;
  }

  export default authorsData;
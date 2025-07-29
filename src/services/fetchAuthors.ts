type AuthorDetailsProps = {
  name?: string;
  photos?: number[];
  biograhy?: string | { value: string };
  birth_date?: string;
  death_date?: string;
};

async function authorsData(
    authorsKeys: string[]
  ): Promise<AuthorDetailsProps[]> {
    const baseUrl = "https://openlibrary.org/";

    const responses = await Promise.all(
      authorsKeys.map((item) => fetch(`${baseUrl}${item}.json`))
    );

    const authors = await Promise.all(
      responses.map(async (res) => {
        if (!res.ok) throw new Error("Fetch failed");
        const item = await res.json();
        return {
          name: item.name,
          photos: item.photos,
          biography: item.biography,
          birth_date: item.birth_date,
          death_date: item.death_date,
        } as AuthorDetailsProps;
      })
    );

    return authors;
  }

  export default authorsData;
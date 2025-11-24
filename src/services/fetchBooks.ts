export type PageParam = number | undefined;

export const fetchData = async <TData>(
  url: string,
  pageParam: PageParam = undefined,
  cacheTime: number = 3600 // Default 1 sat cache
): Promise<TData> => {
  let finalUrl = url;

  if (pageParam !== undefined) {
    const separator = url.includes("?") ? "&" : "?";
    finalUrl = `${url}${separator}cursor=${pageParam}`;
  }

  const response = await fetch(finalUrl, {
    next: { revalidate: cacheTime },
    headers: {
      "User-Agent": "book-app/1.0",
    },
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

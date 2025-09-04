export type PageParam = number | undefined;

export const fetchData = async <TData>(
  url: string,
  pageParam: PageParam = undefined
): Promise<TData> => {
  let finalUrl = url;

  if (pageParam !== undefined) {
    const separator = url.includes('?') ? '&' : '?';
    finalUrl = `${url}${separator}cursor=${pageParam}`;
  }

  const response = await fetch(finalUrl);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};
import type { QueryKey } from '@tanstack/react-query';

export const fetchData = async <TData>(url: string): Promise<TData> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};
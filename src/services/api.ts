import { useEffect, useState } from "react";

type UseFetchOptions = RequestInit;

export function useFetch<T>(url: string, options?: UseFetchOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(url, {
          ...options,
          headers: {
           
            ...(options?.headers || {}),
          },
          
        });
console.log(res)
        if (!res.ok) throw new Error(`Error ${res.status}`);

        const json = (await res.json()) as T;

        if (!isCancelled) {
          setData(json);
          setError(null);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true; 
    };
  }, [url]);

  return { data, loading, error };
}

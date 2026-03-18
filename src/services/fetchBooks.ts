export type PageParam = number | undefined;

type FetchDataOptions = {
  cacheTime?: number;
  retries?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableStatus = (status: number) => status === 429 || status >= 500;

const mergeSignals = (external?: AbortSignal) => {
  const controller = new AbortController();

  if (!external) {
    return { controller, cleanup: () => {} };
  }

  if (external.aborted) {
    controller.abort();
    return { controller, cleanup: () => {} };
  }

  const abortHandler = () => controller.abort();
  external.addEventListener("abort", abortHandler, { once: true });

  return {
    controller,
    cleanup: () => external.removeEventListener("abort", abortHandler),
  };
};

export const fetchData = async <TData>(
  url: string,
  pageParam: PageParam = undefined,
  options: FetchDataOptions = {}
): Promise<TData> => {
  const {
    cacheTime = 3600,
    retries = 2,
    timeoutMs = 8000,
    signal,
  } = options;

  let finalUrl = url;

  if (pageParam !== undefined) {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("offset")) {
      parsed.searchParams.set("offset", String(pageParam));
    }
    finalUrl = parsed.toString();
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const { controller, cleanup } = mergeSignals(signal);
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(finalUrl, {
        signal: controller.signal,
        next: { revalidate: cacheTime },
        headers: {
          "User-Agent": "book-app/1.0",
        },
      });

      if (!response.ok) {
        if (attempt < retries && isRetryableStatus(response.status)) {
          await sleep(250 * (attempt + 1));
          continue;
        }
        throw new Error(
          `Network response was not ok (${response.status} ${response.statusText})`
        );
      }

      return (await response.json()) as TData;
    } catch (error) {
      const isAbortError =
        error instanceof DOMException && error.name === "AbortError";
      if (signal?.aborted) {
        throw new Error("Request aborted");
      }
      if (isAbortError && attempt < retries) {
        await sleep(250 * (attempt + 1));
        continue;
      }
      if (attempt < retries) {
        await sleep(250 * (attempt + 1));
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
      cleanup();
    }
  }

  throw new Error("Failed to fetch data");
};

import { useInfiniteQuery, type QueryFunctionContext, type InfiniteData } from '@tanstack/react-query';
import { fetchData, type PageParam } from './fetchBooks';
import { PAGE_SIZE } from '@/utils/Constants';

export interface Book {
  id: string;
  key: string;
  title: string;
  authors?: { name: string }[];
  cover_edition_key?: string;
}

export interface ProjectsPage {
  data: Book[];
  nextCursor?: number;
}

const projectsInfiniteQueryKey = (url: string) => ['projects', 'infinite', url] as const;

type OpenLibraryDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_edition_key?: string;
};

type OpenLibraryResponse = {
  docs?: OpenLibraryDoc[];
  numFound?: number;
};

const normalizeSearchResponse = (response: OpenLibraryResponse) => {
  const docs = Array.isArray(response.docs) ? response.docs : [];
  const numFound =
    typeof response.numFound === 'number' && response.numFound >= 0
      ? response.numFound
      : docs.length;

  return { docs, numFound };
};


const fetchProjectsInfinite = (baseUrl: string) => async ({
  pageParam = 0,
}: QueryFunctionContext<ReturnType<typeof projectsInfiniteQueryKey>, PageParam>): Promise<ProjectsPage> => {
  const separator = baseUrl.includes('?') ? '&' : '?';
  const url = `${baseUrl}${separator}limit=${PAGE_SIZE}&offset=${pageParam}`;

  const response = await fetchData<OpenLibraryResponse>(url, undefined, {
    timeoutMs: 8000,
    retries: 2,
    cacheTime: 1800,
  });

  const normalized = normalizeSearchResponse(response);

  const books: Book[] = normalized.docs
    .filter((doc) => typeof doc.key === 'string' && typeof doc.title === 'string')
    .map((doc, index) => ({
      id: `${doc.key}-${pageParam + index}`,
      key: doc.key as string,
      title: doc.title as string,
      authors: Array.isArray(doc.author_name)
        ? doc.author_name.map((name) => ({ name }))
        : undefined,
      cover_edition_key:
        typeof doc.cover_edition_key === 'string' ? doc.cover_edition_key : undefined,
    }));

  const nextCursor =
    pageParam + PAGE_SIZE < normalized.numFound
      ? pageParam + PAGE_SIZE
      : undefined;

  return {
    data: books,
    nextCursor,
  };
};

export const useProjectsInfinite = (url: string, enabled: boolean = true) => {
  return useInfiniteQuery<
    ProjectsPage,                 
    Error,
    InfiniteData<ProjectsPage>, 
    ReturnType<typeof projectsInfiniteQueryKey>,
    PageParam
  >({
    queryKey: projectsInfiniteQueryKey(url),
    queryFn: fetchProjectsInfinite(url),
    enabled,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
};

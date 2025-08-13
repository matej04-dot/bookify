import { useInfiniteQuery, type QueryFunctionContext, type InfiniteData } from '@tanstack/react-query';
import { fetchData, type PageParam } from './fetchBooks';
import { PAGE_SIZE } from '@/utils/Constants';

export interface Book {
  id: number;
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


const fetchProjectsInfinite = (baseUrl: string) => async ({
  pageParam = 0,
}: QueryFunctionContext<ReturnType<typeof projectsInfiniteQueryKey>, PageParam>): Promise<ProjectsPage> => {
  const separator = baseUrl.includes('?') ? '&' : '?';
  const url = `${baseUrl}${separator}limit=${PAGE_SIZE}&offset=${pageParam}`;

  const response = await fetchData<{
    docs: Array<{
      key: string;
      title: string;
      author_name?: string[];
      cover_edition_key?: string;
    }>;
    numFound: number;
  }>(url);

  const books: Book[] = response.docs.map((doc, index) => ({
    id: pageParam + index,
    key: doc.key, 
    title: doc.title,
    authors: doc.author_name ? doc.author_name.map(name => ({ name })) : undefined,
    cover_edition_key: doc.cover_edition_key,
  }));

  const nextCursor = pageParam + PAGE_SIZE < response.numFound ? pageParam + PAGE_SIZE : undefined;

  return {
    data: books,
    nextCursor,
  };
};

export const useProjectsInfinite = (url: string) => {
  return useInfiniteQuery<
    ProjectsPage,                 
    Error,
    InfiniteData<ProjectsPage>, 
    ReturnType<typeof projectsInfiniteQueryKey>,
    PageParam
  >({
    queryKey: projectsInfiniteQueryKey(url),
    queryFn: fetchProjectsInfinite(url),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
};

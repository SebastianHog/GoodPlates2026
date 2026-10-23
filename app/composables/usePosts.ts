export function usePosts(search?: Ref<string | undefined>, options: { lazy?: boolean } = {}) {
  return useFetch<IPostContent[]>("/api/posts", { query: { q: search }, lazy: options.lazy });
}

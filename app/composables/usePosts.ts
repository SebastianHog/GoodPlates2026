export function usePosts(search?: Ref<string | undefined>) {
  return useFetch<IPostContent[]>("/api/posts", { query: { q: search } });
}

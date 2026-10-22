export function usePosts() {
  return useFetch<IPostContent[]>("/api/posts");
}

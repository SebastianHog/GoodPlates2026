export function usePosts(
  search?: Ref<string | undefined>,
  options: { lazy?: boolean; feed?: Ref<FeedId> } = {},
) {
  return useFetch<IPostContent[]>("/api/posts", {
    query: { q: search, feed: options.feed },
    lazy: options.lazy,
  });
}

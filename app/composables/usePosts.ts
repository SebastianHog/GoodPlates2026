interface PostQuery {
  search?: string;
  feed?: FeedId;
  author?: string;
}

// A list of posts from /api/posts, a page at a time; loadMore() adds the next page.
// Discover has no pages, so it never has more
export function usePosts(
  options: {
    search?: Ref<string | undefined>;
    feed?: Ref<FeedId>;
    author?: string;
    limit?: number;
    lazy?: boolean;
  } = {},
) {
  const limit = options.limit ?? POST_PAGE_SIZE;
  const query = (): PostQuery => ({
    search: options.search?.value,
    feed: options.feed?.value,
    author: options.author,
  });

  const fetched = useFetch<IPostContent[]>("/api/posts", {
    query: { q: options.search, feed: options.feed, author: options.author, limit },
    lazy: options.lazy,
  });
  const pages = usePostPages(fetched.data, query, limit);
  return { ...fetched, ...pages };
}

// Adds "load more" to a first page of posts that came from elsewhere (a feed, a profile)
export function usePostPages(
  firstPage: Ref<IPostContent[] | null | undefined>,
  query: () => PostQuery,
  limit = POST_PAGE_SIZE,
) {
  const { t } = useI18n();
  const { show: showToast } = useToast();
  const more = ref<IPostContent[]>([]);
  const lastPageFull = ref(false);
  const loadingMore = ref(false);

  // A new first page (other feed, new search, retry) starts the list over
  watch(
    firstPage,
    (page) => {
      more.value = [];
      lastPageFull.value = (page?.length ?? 0) >= limit;
    },
    { immediate: true },
  );

  const posts = computed(() => firstPage.value && [...firstPage.value, ...more.value]);
  const hasMore = computed(() => lastPageFull.value && query().feed !== "discover");

  async function loadMore() {
    const last = posts.value?.at(-1);
    if (!last || loadingMore.value || !hasMore.value) return;

    loadingMore.value = true;
    try {
      const { search, ...rest } = query();
      const page = await $fetch<IPostContent[]>("/api/posts", {
        query: { q: search, ...rest, limit, before: pageCursor(last) },
      });
      more.value = [...more.value, ...page];
      lastPageFull.value = page.length >= limit;
    } catch {
      showToast(t("feed.loadMoreFailed"));
    } finally {
      loadingMore.value = false;
    }
  }

  return { posts, hasMore, loadingMore, loadMore };
}

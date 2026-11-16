import type { ComponentPublicInstance } from "vue";

interface PostQuery {
  search?: string;
  feed?: FeedId;
  author?: string;
}

// A list of posts from /api/posts: 7 first, then loadMore() adds 10 at a time.
// Discover has no pages, so it never has more
export function usePosts(
  options: {
    search?: Ref<string | undefined>;
    feed?: Ref<FeedId>;
    author?: string;
    lazy?: boolean;
  } = {},
) {
  const query = (): PostQuery => ({
    search: options.search?.value,
    feed: options.feed?.value,
    author: options.author,
  });

  const fetched = useFetch<IPostContent[]>("/api/posts", {
    query: { q: options.search, feed: options.feed, author: options.author, limit: POST_FIRST_PAGE },
    lazy: options.lazy,
  });
  const pages = usePostPages(fetched.data, query);
  return { ...fetched, ...pages };
}

// Adds "load more" to a first page of posts that came from elsewhere (a feed, a profile).
// Put the returned `list` on the <post-container> (ref="list") for infinite scroll: the next 10 load as the
// reader reaches the last post; "Show more" stays as the keyboard way and the retry after a failed load
export function usePostPages(
  firstPage: Ref<IPostContent[] | null | undefined>,
  query: () => PostQuery,
) {
  const { t } = useI18n();
  const { show: showToast } = useToast();
  const more = ref<IPostContent[]>([]);
  // Whether the last page that came back was full; null until a later page has loaded.
  // Derived from the first page otherwise, so the server render (where watchers don't run) agrees with the browser
  const nextPageFull = ref<boolean | null>(null);
  const loadingMore = ref(false);

  // A new first page (other feed, new search, retry) starts the list over
  watch(firstPage, () => {
    more.value = [];
    nextPageFull.value = null;
  });

  const posts = computed(() => firstPage.value && [...firstPage.value, ...more.value]);
  const lastPageFull = computed(
    () => nextPageFull.value ?? (firstPage.value?.length ?? 0) >= POST_FIRST_PAGE,
  );
  const hasMore = computed(() => lastPageFull.value && query().feed !== "discover");

  const list = shallowRef<ComponentPublicInstance | null>(null);
  useLoadNearEnd(() => list.value?.$el, () => posts.value?.length ?? 0, loadMore);

  async function loadMore() {
    const last = posts.value?.at(-1);
    if (!last || loadingMore.value || !hasMore.value) return;

    // The list can change while this page loads (other tab, new search, other profile); then the answer is dropped
    const start = firstPage.value;
    loadingMore.value = true;
    try {
      const { search, ...rest } = query();
      const page = await $fetch<IPostContent[]>("/api/posts", {
        query: { q: search, ...rest, limit: POST_NEXT_PAGE, before: pageCursor(last) },
      });
      if (firstPage.value !== start) return;
      more.value = [...more.value, ...page];
      nextPageFull.value = page.length >= POST_NEXT_PAGE;
    } catch {
      if (firstPage.value === start) showToast(t("feed.loadMoreFailed"));
    } finally {
      loadingMore.value = false;
    }
  }

  return { posts, hasMore, loadingMore, loadMore, list };
}

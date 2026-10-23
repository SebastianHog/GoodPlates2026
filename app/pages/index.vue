<template>
  <section class="feed">
    <!-- IF user is not logged in, see little text about what goodplates is about, 
     show posts normally to logged in users-->
    <header v-if="showIntro" class="feed__intro">
      <h1 class="page-title">{{ $t("feed.introTitle") }}</h1>
      <p class="feed__lead">
        {{ $t("feed.intro") }}
        <NuxtLink to="/login?tab=signup">{{ $t("feed.introJoin") }}</NuxtLink>
      </p>
    </header>
    <h1 v-else class="visually-hidden">{{ $t("feed.title") }}</h1>

    <segmented-tabs
      v-if="!search"
      v-model="feed"
      class="feed__tabs"
      :tabs="feedTabs"
      :label="$t('feed.tabsLabel')"
      panel-id="feed-panel"
      id-prefix="feed-tab"
    />

    <div
      id="feed-panel"
      :role="search ? undefined : 'tabpanel'"
      :aria-labelledby="search ? undefined : `feed-tab-${feed}`"
    >
      <load-state
        :status="status"
        :error="error"
        :loading-label="$t('feed.loading')"
        :failed-label="$t('feed.loadFailed')"
        @retry="refresh"
      >
        <status-message v-if="search">
          {{
            $t(posts?.length ? "feed.matching" : "feed.noMatches", {
              query: search,
            })
          }}
          <NuxtLink to="/">{{ $t("feed.showAll") }}</NuxtLink>
        </status-message>
        <status-message
          v-else-if="posts && !posts.length && feed === 'following'"
        >
          {{ $t("feed.followingEmpty") }}
          <NuxtLink to="/?feed=discover">{{ $t("feed.findCooks") }}</NuxtLink>
        </status-message>
        <status-message v-else-if="posts && !posts.length">
          {{ $t("feed.empty") }}
          <NuxtLink :to="loggedIn ? '/create' : '/login?tab=signup'">
            {{ $t(loggedIn ? "feed.emptyPost" : "feed.emptyJoin") }}
          </NuxtLink>
        </status-message>

        <post-container>
          <recipe-post v-for="post in posts" :key="post.id" v-bind="post" />
        </post-container>
        <show-more :has-more="hasMore" :loading="loadingMore" @more="loadMore" />
      </load-state>
    </div>
  </section>
</template>

<script lang="ts" setup>
const route = useRoute();
const { t } = useI18n();
const { loggedIn } = useUserSession();
const search = computed(
  () =>
    (typeof route.query.q === "string" && route.query.q.trim()) || undefined,
);

const router = useRouter();

// Which feed is shown lives in the url (?feed=discover), latest is the default
const feed = computed<FeedId>({
  get: () => {
    if (route.query.feed === "discover") return "discover";
    if (route.query.feed === "following" && loggedIn.value) return "following";
    return "latest";
  },
  set: (value) =>
    router.replace({
      query: { ...route.query, feed: value === "latest" ? undefined : value },
    }),
});

// following only makes sense when logged in
const feedTabs = computed<{ id: FeedId; label: string }[]>(() => [
  { id: "latest", label: t("feed.latest") },
  ...(loggedIn.value
    ? [{ id: "following" as const, label: t("feed.following") }]
    : []),
  { id: "discover", label: t("feed.discover") },
]);

const { posts, status, error, refresh, hasMore, loadingMore, loadMore } =
  usePosts({ search, feed, lazy: true });

const showIntro = computed(() => !loggedIn.value && !search.value);

useHead({
  title: () =>
    t("site.pageTitle", {
      page: search.value
        ? t("feed.matching", { query: search.value })
        : t(
            feed.value === "latest" ? "feed.title" : `feed.${feed.value}`,
          ),
    }),
});
</script>

<style scoped>
.feed {
  max-width: 48rem;
  margin: 0 auto;
}

.feed__intro {
  margin-bottom: 2rem;
}

.feed__tabs {
  max-width: 26rem;
  margin-bottom: 1.5rem;
}

.feed__lead {
  max-width: 60ch;
  margin: 0.5rem 0 0;
  color: var(--color-text-muted);
  text-wrap: pretty;
}

.feed__lead a {
  color: var(--color-primary);
  font-weight: 600;
  text-underline-offset: 3px;
}

.feed__lead a:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>

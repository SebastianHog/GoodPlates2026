<template>
  <section class="feed">
    <!-- IF user is not logged in, see little text about what goodplates is about, 
     show posts normally to logged in users-->
    <header v-if="showIntro" class="feed__intro">
      <h1 class="feed__title">{{ $t("feed.introTitle") }}</h1>
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
      <!-- While posts load: grey stand-ins in their shape, and a line for screen readers -->
      <template v-if="status === 'pending'">
        <p class="visually-hidden" role="status">{{ $t("feed.loading") }}</p>
        <post-container aria-hidden="true">
          <recipe-post-skeleton v-for="n in 3" :key="n" />
        </post-container>
      </template>

      <p v-else-if="error" class="feed__message" role="alert">
        {{ $t("feed.loadFailed") }}
        <button type="button" class="feed__retry" @click="() => refresh()">
          {{ $t("feed.retry") }}
        </button>
      </p>

      <template v-else>
        <p v-if="search" class="feed__message">
          {{
            $t(posts?.length ? "feed.matching" : "feed.noMatches", {
              query: search,
            })
          }}
          <NuxtLink to="/">{{ $t("feed.showAll") }}</NuxtLink>
        </p>
        <p v-else-if="posts && !posts.length" class="feed__message">
          {{ $t("feed.empty") }}
          <NuxtLink :to="loggedIn ? '/create' : '/login?tab=signup'">
            {{ $t(loggedIn ? "feed.emptyPost" : "feed.emptyJoin") }}
          </NuxtLink>
        </p>

        <post-container>
          <recipe-post v-for="post in posts" :key="post.id" v-bind="post" />
        </post-container>
      </template>
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
  get: () => (route.query.feed === "discover" ? "discover" : "latest"),
  set: (value) =>
    router.replace({
      query: { ...route.query, feed: value === "latest" ? undefined : value },
    }),
});

const feedTabs = computed<{ id: FeedId; label: string }[]>(() => [
  { id: "latest", label: t("feed.latest") },
  { id: "discover", label: t("feed.discover") },
]);

const {
  data: posts,
  status,
  error,
  refresh,
} = usePosts(search, {
  lazy: true,
  feed,
});

const showIntro = computed(() => !loggedIn.value && !search.value);

useHead({
  title: () =>
    t("site.pageTitle", {
      page: search.value
        ? t("feed.matching", { query: search.value })
        : t(feed.value === "discover" ? "feed.discover" : "feed.title"),
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
  max-width: 20rem;
  margin-bottom: 1.5rem;
}

.feed__title {
  margin: 0;
  font-family: var(--font-family-serif);
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.25;
  text-wrap: balance;
}

.feed__lead {
  max-width: 60ch;
  margin: 0.5rem 0 0;
  color: var(--color-text-muted);
  text-wrap: pretty;
}

.feed__message {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0 0 1.5rem;
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
}

.feed__retry {
  padding: 0;
  border: none;
  background: none;
  color: var(--color-primary);
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.feed__lead a,
.feed__message a {
  color: var(--color-primary);
  font-weight: 600;
  text-underline-offset: 3px;
}

.feed__lead a:focus-visible,
.feed__message a:focus-visible,
.feed__retry:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>

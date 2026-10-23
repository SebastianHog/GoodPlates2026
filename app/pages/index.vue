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

const { data: posts } = await usePosts(search);

const showIntro = computed(() => !loggedIn.value && !search.value);

useHead({
  title: () =>
    t("site.pageTitle", {
      page: search.value
        ? t("feed.matching", { query: search.value })
        : t("feed.title"),
    }),
});
</script>

<style scoped>
/* One post per row, as wide as the bookmarks list */
.feed {
  max-width: 48rem;
  margin: 0 auto;
}

.feed__intro {
  margin-bottom: 2rem;
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

.feed__lead a,
.feed__message a {
  color: var(--color-primary);
  font-weight: 600;
  text-underline-offset: 3px;
}

.feed__lead a:focus-visible,
.feed__message a:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>

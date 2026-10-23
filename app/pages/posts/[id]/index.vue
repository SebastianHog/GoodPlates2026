<template>
  <section class="post-page">
    <template v-if="status === 'pending'">
      <p class="visually-hidden" role="status">{{ $t("post.loading") }}</p>
      <recipe-post-skeleton />
    </template>

    <p v-else-if="error?.statusCode === 404" class="post-page__message">
      {{ $t("post.notFound") }}
      <NuxtLink to="/">{{ $t("post.backToFeed") }}</NuxtLink>
    </p>

    <p v-else-if="error" class="post-page__message" role="alert">
      {{ $t("post.loadFailed") }}
      <button type="button" class="post-page__retry" @click="() => refresh()">
        {{ $t("feed.retry") }}
      </button>
    </p>

    <recipe-article v-else-if="post" v-bind="post" />
  </section>
</template>

<script lang="ts" setup>
const route = useRoute();
const { t } = useI18n();

const {
  data: post,
  status,
  error,
  refresh,
} = useFetch<IPostContent>(() => `/api/posts/${route.params.id}`, {
  lazy: true,
});

useWakeLock();

useHead({
  title: () =>
    t("site.pageTitle", { page: post.value?.title ?? t("feed.title") }),
});
</script>

<style scoped>
.post-page {
  max-width: 60rem;
  margin: 0 auto;
}

.post-page__message {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  color: var(--color-text-muted);
}

.post-page__message a,
.post-page__retry {
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

.post-page__message a:focus-visible,
.post-page__retry:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>

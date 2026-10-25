<template>
  <section class="post-page">
    <load-state
      :status="status"
      :error="error"
      :loading-label="$t('post.loading')"
      :failed-label="$t('post.loadFailed')"
      :skeletons="1"
      @retry="refresh"
    >
      <template #notFound>
        {{ $t("post.notFound") }}
        <NuxtLink to="/">{{ $t("post.backToFeed") }}</NuxtLink>
      </template>

      <recipe-article v-if="post" v-bind="post" />
    </load-state>
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

// A missing post should answer 404, not a 200 "not found" page that search engines would index
const requestEvent = useRequestEvent();
watchEffect(() => {
  if (requestEvent && (error.value as { statusCode?: number } | null)?.statusCode === 404) {
    setResponseStatus(requestEvent, 404);
  }
});

useWakeLock();

useHead({
  title: () =>
    t("site.pageTitle", { page: post.value?.title ?? t("feed.title") }),
});

// A link to a recipe should preview with its title, a caption excerpt and its photo when shared
const { imageBaseUrl } = useRuntimeConfig().public;
const origin = import.meta.server ? useRequestURL().origin : "";
useSeoMeta({
  description: () => post.value?.caption?.slice(0, 200) || undefined,
  ogTitle: () => post.value?.title,
  ogDescription: () => post.value?.caption?.slice(0, 200) || undefined,
  ogType: "article",
  ogImage: () =>
    post.value?.images[0] ? `${origin}${imageBaseUrl}/${post.value.images[0]}-800.webp` : undefined,
});
</script>

<style scoped>
.post-page {
  max-width: 60rem;
  margin: 0 auto;
}
</style>

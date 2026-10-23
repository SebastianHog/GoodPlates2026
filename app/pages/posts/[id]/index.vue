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
</style>

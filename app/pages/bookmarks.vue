<template>
  <section class="bookmarks-page">
    <h1 class="bookmarks-page__title">{{ $t("bookmarks.title") }}</h1>

    <div v-if="posts?.length" class="bookmarks-page__list">
      <recipe-row v-for="post in posts" :key="post.id" v-bind="post" />
    </div>

    <div v-else class="bookmarks-page__empty">
      <p>{{ $t("bookmarks.empty") }}</p>
      <NuxtLink to="/">{{ $t("bookmarks.browse") }}</NuxtLink>
    </div>
  </section>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: "auth" });

const { t } = useI18n();

useHead({ title: () => t("site.pageTitle", { page: t("bookmarks.title") }) });

const { data: posts } = await useFetch<IPostContent[]>("/api/bookmarks");
</script>

<style scoped>
.bookmarks-page {
  max-width: 48rem;
  margin: 0 auto;
}

.bookmarks-page__title {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
}

.bookmarks-page__list {
  border-top: 1px solid var(--color-border);
}

.bookmarks-page__empty {
  padding: 3rem 0;
  color: var(--color-text-muted);
}

.bookmarks-page__empty a {
  color: var(--color-primary);
  font-weight: 600;
}
</style>

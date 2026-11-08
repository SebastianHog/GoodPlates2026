<template>
  <section>
    <header class="edit-page__header">
      <NuxtLink :to="`/posts/${route.params.id}`" class="edit-page__back">
        <app-icon name="chevron-left" />
        {{ $t("editor.backToRecipe") }}
      </NuxtLink>
      <h1 class="page-title">{{ $t("editor.editTitle") }}</h1>
    </header>
    <!-- A missing recipe is a 404 (thrown below); anything else is a failed load worth retrying -->
    <status-message v-if="error" role="alert">
      {{ $t("editor.loadFailed") }}
      <button type="button" @click="() => refresh()">{{ $t("feed.retry") }}</button>
    </status-message>
    <status-message v-else-if="post && post.author.id !== user?.id">
      {{ $t("editor.notYours") }}
    </status-message>
    <post-editor v-else-if="post" :post="post" />
  </section>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: "auth" });

const route = useRoute();
const { user } = useUserSession();
const { data: post, error, refresh } = await useFetch<IPostContent>(`/api/posts/${route.params.id}`);

if (error.value?.statusCode === 404) {
  throw createError({ statusCode: 404, statusMessage: "Recipe not found", fatal: true });
}

const { t } = useI18n();

useHead({
  title: () =>
    t("site.pageTitle", {
      page: post.value ? t("editor.editPageTitle", { title: post.value.title }) : t("editor.editTitle"),
    }),
});
</script>

<style lang="scss" scoped>
@use "~/assets/scss/tokens" as *;
@use "~/assets/scss/mixins" as *;

.edit-page__header {
  max-width: $content-max-width;
  margin: 0 auto $space-6;
}

.edit-page__back {
  @include text-link;
  @include touch-area;

  display: inline-flex;
  align-items: center;
  gap: $space-1;
  margin-bottom: $space-3;
  color: $color-text-muted;
  font-size: $font-size-sm;

  .app-icon {
    width: 1rem;
    height: 1rem;
  }
}
</style>

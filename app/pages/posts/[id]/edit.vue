<template>
  <section>
    <h1 class="edit-page__title">{{ $t("editor.editTitle") }}</h1>
    <p v-if="error" class="edit-page__message">{{ $t("editor.notFound") }}</p>
    <p v-else-if="post && post.author.id !== user?.id" class="edit-page__message">
      {{ $t("editor.notYours") }}
    </p>
    <post-editor v-else-if="post" :post="post" />
  </section>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: "auth" });

const route = useRoute();
const { user } = useUserSession();
const { data: post, error } = await useFetch<IPostContent>(`/api/posts/${route.params.id}`);

const { t } = useI18n();

useHead({
  title: () =>
    t("site.pageTitle", {
      page: post.value ? t("editor.editPageTitle", { title: post.value.title }) : t("editor.editTitle"),
    }),
});
</script>

<style scoped>
.edit-page__title {
  max-width: 72rem;
  margin: 0 auto 1.5rem;
  font-family: var(--font-family-serif);
  font-size: 1.5rem;
  font-weight: 600;
}

.edit-page__message {
  color: var(--color-text-muted);
}
</style>

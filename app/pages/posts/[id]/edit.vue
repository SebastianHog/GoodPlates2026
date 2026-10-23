<template>
  <section>
    <h1 class="page-title edit-page__title">{{ $t("editor.editTitle") }}</h1>
    <status-message v-if="error">{{ $t("editor.notFound") }}</status-message>
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
}
</style>

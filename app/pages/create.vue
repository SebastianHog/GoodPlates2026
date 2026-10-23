<template>
  <section>
    <h1 class="create-page__title">{{ $t("editor.newTitle") }}</h1>
    <post-editor />
  </section>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: "auth" });

const { t } = useI18n();

useHead({ title: () => t("site.pageTitle", { page: t("editor.newTitle") }) });
</script>

<style scoped>
.create-page__title {
  max-width: 72rem;
  margin: 0 auto 1.5rem;
  font-size: 1.5rem;
}
</style>

<template>
  <NuxtLayout name="default">
    <section class="error-page">
      <h1 class="error-page__title">
        {{ is404 ? $t("error.title404") : $t("error.titleGeneric") }}
      </h1>
      <p class="error-page__message">
        {{ is404 ? $t("error.message404") : $t("error.messageGeneric") }}
      </p>
      <NuxtLink class="error-page__home" to="/" @click="goHome">
        {{ $t("error.backHome") }}
      </NuxtLink>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
// Replaces Nuxt's default error page, which had no site header, no html lang and a "| Nuxt" title
const props = defineProps<{ error: { statusCode?: number } }>();

const { t, locale } = useI18n();
const is404 = computed(() => props.error?.statusCode === 404);

useHead({
  htmlAttrs: { lang: locale },
  title: () =>
    t("site.pageTitle", { page: t(is404.value ? "error.title404" : "error.titleGeneric") }),
});

function goHome() {
  clearError({ redirect: "/" });
}
</script>

<style scoped>
.error-page {
  max-width: 32rem;
  margin: 3rem auto;
  text-align: center;
}

.error-page__title {
  font-family: var(--font-family-serif);
  font-size: 1.75rem;
  font-weight: 600;
}

.error-page__message {
  margin: 0.75rem 0 1.5rem;
  color: var(--color-text-muted);
}
</style>

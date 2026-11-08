<template>
  <NuxtLayout>
    <section class="error-page">
      <h1 class="page-title">
        {{ notFound ? $t("errorPage.notFoundTitle") : $t("errorPage.failedTitle") }}
      </h1>
      <p class="error-page__text">
        {{ notFound ? $t("errorPage.notFoundText") : $t("errorPage.failedText") }}
      </p>

      <div class="error-page__actions">
        <a class="error-page__button error-page__button--primary" href="/" @click.prevent="goHome">
          {{ $t("post.backToFeed") }}
        </a>
        <button v-if="!notFound" class="error-page__button" type="button" @click="retry">
          {{ $t("errorPage.retry") }}
        </button>
      </div>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { NuxtError } from "#app";

// Shown for addresses that don't exist (404) and for pages that fail to load
const props = defineProps<{ error: NuxtError }>();

const { t } = useI18n();

const notFound = computed(() => props.error.statusCode === 404);

useHead({
  title: () => t("site.pageTitle", { page: t(notFound.value ? "errorPage.notFoundTitle" : "errorPage.failedTitle") }),
});

// The error has to be cleared, or the next page would still show it
function goHome() {
  clearError({ redirect: "/" });
}

function retry() {
  window.location.reload();
}
</script>

<style lang="scss" scoped>
@use "~/assets/scss/tokens" as *;
@use "~/assets/scss/mixins" as *;

.error-page {
  max-width: 32rem;
  margin: 0 auto;
  padding: $space-12 0;
}

.error-page__text {
  margin: $space-3 0 $space-6;
  color: $color-text-muted;
}

.error-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
}

.error-page__button {
  display: inline-flex;
  align-items: center;
  padding: $space-2 $space-3;
  border: 1px solid $color-border-secondary;
  border-radius: $radius-sm;
  background: $color-surface;
  color: $color-text;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  text-decoration: none;
  cursor: pointer;
  transition:
    background $transition-fast,
    border-color $transition-fast,
    transform 160ms $ease-out;

  &:hover {
    border-color: $color-text-muted;
  }

  @include press;
  @include focus-ring;

  &--primary {
    border-color: $color-primary;
    background: $color-primary;
    color: $color-surface;

    &:hover {
      border-color: $color-primary-hover;
      background: $color-primary-hover;
    }
  }
}
</style>

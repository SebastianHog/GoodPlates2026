<template>
  <section class="schedule-form-page">
    <h1 class="page-title schedule-form-page__title">{{ $t("schedules.editor.newTitle") }}</h1>
    <status-message v-if="atLimit">
      {{ $t("schedules.errors.limit", { perUser: SCHEDULE_LIMITS.perUser }) }}
      <NuxtLink to="/schedules">{{ $t("schedules.view.back") }}</NuxtLink>
    </status-message>
    <schedule-editor v-else />
  </section>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: "auth" });

const { t } = useI18n();
useHead({ title: () => t("site.pageTitle", { page: t("schedules.editor.newTitle") }) });

const { data: own } = await useFetch<IScheduleSummary[]>("/api/schedules", { query: { mine: 1 }, key: "own-schedules" });
const atLimit = computed(() => (own.value?.length ?? 0) >= SCHEDULE_LIMITS.perUser);
</script>

<style scoped>
.schedule-form-page {
  max-width: 40rem;
  margin: 0 auto;
}

.schedule-form-page__title {
  margin-bottom: 1.5rem;
}
</style>

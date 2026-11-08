<template>
  <section class="schedule-form-page">
    <h1 class="page-title schedule-form-page__title">{{ $t("schedules.editor.editTitle") }}</h1>
    <status-message v-if="error || !schedule">
      {{ $t("schedules.view.notFound") }}
      <NuxtLink to="/schedules">{{ $t("schedules.view.back") }}</NuxtLink>
    </status-message>
    <status-message v-else-if="schedule.owner.id !== user?.id">
      {{ $t("schedules.errors.notYours") }}
      <NuxtLink :to="`/schedules/${schedule.id}`">{{ $t("schedules.view.backToSchedule") }}</NuxtLink>
    </status-message>
    <schedule-editor v-else :schedule="schedule" />
  </section>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: "auth" });

const route = useRoute();
const { t } = useI18n();
const { user } = useUserSession();

const { data: schedule, error } = await useFetch<ISchedule>(() => `/api/schedules/${route.params.id}`);

useHead({
  title: () =>
    t("site.pageTitle", {
      page: schedule.value ? t("schedules.editor.editPageTitle", { name: schedule.value.name }) : t("schedules.editor.editTitle"),
    }),
});
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

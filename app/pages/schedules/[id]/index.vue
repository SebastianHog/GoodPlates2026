<template>
  <section class="schedule-page">
    <status-message v-if="error?.statusCode === 404">
      {{ $t("schedules.view.notFound") }}
      <NuxtLink to="/schedules">{{ $t("schedules.view.back") }}</NuxtLink>
    </status-message>
    <status-message v-else-if="error || !schedule" role="alert">
      {{ $t("schedules.view.loadFailed") }}
      <button type="button" @click="refresh()">{{ $t("feed.retry") }}</button>
    </status-message>

    <template v-else>
      <header class="schedule-page__header">
        <NuxtLink to="/schedules" class="schedule-page__back">
          <app-icon name="chevron-left" />
          {{ $t("schedules.view.back") }}
        </NuxtLink>

        <h1 class="page-title">{{ schedule.name }}</h1>
        <p class="schedule-page__meta">
          <NuxtLink v-if="schedule.owner.hiddenName" :to="`/u/${schedule.owner.hiddenName}`" class="schedule-page__author">
            {{ schedule.owner.displayName }}
          </NuxtLink>
          <span v-else>{{ authorName(schedule.owner) }}</span>
          · {{ $t("schedules.card.days", schedule.dayCount) }} · {{ $t("schedules.card.recipes", schedule.recipeCount) }}
          <template v-if="isMine">
            · {{ schedule.isPublic ? $t("schedules.view.public") : $t("schedules.view.private") }}
          </template>
        </p>

        <p v-if="schedule.source" class="schedule-page__source">
          <template v-if="schedule.source.name">
            <i18n-t keypath="schedules.view.savedFrom" tag="span" scope="global">
              <template #name>
                <NuxtLink :to="`/schedules/${schedule.source.id}`">{{ schedule.source.name }}</NuxtLink>
              </template>
              <template #author>{{ schedule.source.owner ? authorName(schedule.source.owner) : $t("site.deletedUser") }}</template>
            </i18n-t>
            <span v-if="schedule.source.changedSinceSave" class="schedule-page__changed">
              {{ $t("schedules.view.sourceChanged") }}
            </span>
          </template>
          <template v-else>{{ $t("schedules.view.sourceGone") }}</template>
        </p>

        <p v-if="schedule.description" class="schedule-page__description">{{ schedule.description }}</p>

        <div class="schedule-page__actions">
          <template v-if="isMine">
            <NuxtLink :to="`/schedules/${schedule.id}/edit`" class="schedule-page__button">
              {{ $t("schedules.view.edit") }}
            </NuxtLink>
            <button class="schedule-page__delete" type="button" :disabled="deleting" @click="remove">
              {{ $t("schedules.view.delete") }}
            </button>
          </template>
          <NuxtLink
            v-else-if="schedule.mySavedCopyId"
            :to="`/schedules/${schedule.mySavedCopyId}`"
            class="schedule-page__button"
          >
            {{ $t("schedules.view.openCopy") }}
          </NuxtLink>
          <button
            v-else-if="loggedIn"
            class="schedule-page__button schedule-page__button--primary"
            type="button"
            :disabled="saving"
            @click="save"
          >
            {{ $t(saving ? "schedules.view.saving" : "schedules.view.save") }}
          </button>
          <NuxtLink v-else to="/login" class="schedule-page__button schedule-page__button--primary">
            {{ $t("schedules.view.logInToSave") }}
          </NuxtLink>
        </div>
      </header>

      <booklet-spread class="schedule-page__spread">
        <template #left>
          <div class="schedule-page__days">
            <section v-for="(day, index) in schedule.days" :key="index" class="schedule-page__day">
              <h2 class="schedule-page__day-title">{{ $t("schedules.day", { n: index + 1 }) }}</h2>
              <p v-if="isEmpty(day)" class="schedule-page__nothing">{{ $t("schedules.nothingPlanned") }}</p>
              <template v-for="meal in MEALS" :key="meal">
                <div v-if="day[meal].length" class="schedule-page__meal">
                  <h3 class="schedule-page__meal-title">{{ $t(`schedules.meals.${meal}`) }}</h3>
                  <ul class="schedule-page__recipes">
                    <li v-for="postId in day[meal]" :key="postId">
                      <schedule-recipe :post="schedule.posts[postId] ?? null" />
                    </li>
                  </ul>
                </div>
              </template>
            </section>
          </div>
        </template>
        <template #right>
          <shopping-list :schedule-id="schedule.id" :days="schedule.days" :posts="schedule.posts" />
        </template>
      </booklet-spread>
    </template>
  </section>
</template>

<script lang="ts" setup>
const route = useRoute();
const { t } = useI18n();
const authorName = useAuthorName();
const { loggedIn, user } = useUserSession();
const { show: showToast } = useToast();

const { data: schedule, error, refresh } = await useFetch<ISchedule>(() => `/api/schedules/${route.params.id}`);

const isMine = computed(() => Boolean(user.value && schedule.value?.owner.id === user.value.id));

useHead({
  title: () => t("site.pageTitle", { page: schedule.value?.name ?? t("schedules.title") }),
});

useSeoMeta({
  description: () => schedule.value?.description || undefined,
  ogTitle: () => schedule.value?.name,
  ogDescription: () => schedule.value?.description || undefined,
});

function isEmpty(day: ScheduleDay) {
  return MEALS.every((meal) => !day[meal].length);
}

// Saving a copy of someone else's schedule

const saving = ref(false);

async function save() {
  if (!schedule.value) return;
  saving.value = true;
  try {
    const { id } = await $fetch<{ id: string }>(`/api/schedules/${schedule.value.id}/save`, { method: "POST" });
    showToast(t("schedules.view.saved"), { tone: "info" });
    await navigateTo(`/schedules/${id}`);
  } catch (e) {
    const key = (e as { data?: { data?: { messageKey?: string } } }).data?.data?.messageKey;
    showToast(t(key ?? "schedules.view.saveFailed", { perUser: SCHEDULE_LIMITS.perUser }));
  } finally {
    saving.value = false;
  }
}

// Deleting your own

const deleting = ref(false);

async function remove() {
  if (!schedule.value || !window.confirm(t("schedules.view.deleteConfirm"))) return;
  deleting.value = true;
  try {
    await $fetch(`/api/schedules/${schedule.value.id}`, { method: "DELETE" });
    showToast(t("schedules.view.deleted"), { tone: "info" });
    await navigateTo("/schedules");
  } catch {
    showToast(t("schedules.view.deleteFailed"));
  } finally {
    deleting.value = false;
  }
}
</script>

<style lang="scss" scoped>
@use "~/assets/scss/tokens" as *;
@use "~/assets/scss/mixins" as *;

.schedule-page {
  max-width: 64rem;
  margin: 0 auto;
}

.schedule-page__header {
  max-width: 44rem;
  margin-bottom: $space-6;
}

.schedule-page__back {
  @include text-link;

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

.schedule-page__meta,
.schedule-page__source {
  margin: $space-2 0 0;
  color: $color-text-muted;
  font-size: $font-size-sm;
}

.schedule-page__author,
.schedule-page__source a {
  @include text-link;

  color: $color-text;
  font-weight: $font-weight-semibold;
}

.schedule-page__changed {
  margin-left: $space-2;
  padding: 0 $space-2;
  border-radius: $radius-sm;
  background: rgb($color-primary, 0.1);
  color: $color-primary;
  font-weight: $font-weight-semibold;
}

.schedule-page__description {
  max-width: 60ch;
  margin: $space-4 0 0;
  line-height: $line-height-relaxed;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.schedule-page__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-3;
  margin-top: $space-4;
}

.schedule-page__button {
  @include button;

  &--primary {
    @include button-primary;
  }
}

.schedule-page__delete {
  @include text-link;

  padding: $space-2 0;
  border: none;
  background: none;
  color: $color-error;
  font: inherit;
  font-size: $font-size-sm;
  cursor: pointer;
}

.schedule-page__days {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.schedule-page__day-title {
  margin: 0 0 $space-2;
  padding-bottom: $space-1;
  border-bottom: 1px solid $color-border-secondary;
  font-family: $font-family-serif;
  font-size: $font-size-xl;
  font-weight: $font-weight-semibold;
  line-height: $line-height-tight;
}

.schedule-page__nothing {
  margin: 0;
  color: $color-text-muted;
  font-size: $font-size-sm;
}

.schedule-page__meal + .schedule-page__meal {
  margin-top: $space-3;
}

.schedule-page__meal-title {
  margin: 0 0 $space-2;
  color: $color-text-muted;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
}

.schedule-page__recipes {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>

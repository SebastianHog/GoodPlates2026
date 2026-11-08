<template>
  <section class="schedules-page">
    <h1 class="page-title">{{ $t("schedules.title") }}</h1>
    <p class="schedules-page__intro">{{ $t("schedules.intro") }}</p>

    <section v-if="loggedIn" class="schedules-page__section" aria-labelledby="own-schedules-heading">
      <div class="schedules-page__section-header">
        <h2 id="own-schedules-heading" class="schedules-page__heading">
          {{ $t("schedules.yours") }}
          <span class="schedules-page__count">{{ $t("schedules.yoursCount", { count: own?.length ?? 0, max: SCHEDULE_LIMITS.perUser }) }}</span>
        </h2>
        <NuxtLink v-if="!atLimit" to="/schedules/new" class="schedules-page__new">
          <app-icon name="plus" />
          {{ $t("schedules.new") }}
        </NuxtLink>
      </div>

      <status-message v-if="ownError" role="alert">
        {{ $t("schedules.loadFailed") }}
        <button type="button" @click="refreshOwn()">{{ $t("feed.retry") }}</button>
      </status-message>
      <template v-else>
        <p v-if="atLimit" class="schedules-page__note">{{ $t("schedules.limitReached", { max: SCHEDULE_LIMITS.perUser }) }}</p>
        <status-message v-if="!own?.length">{{ $t("schedules.noneYet") }}</status-message>
        <div v-else class="schedules-page__list">
          <schedule-card v-for="schedule in own" :key="schedule.id" v-bind="schedule" show-status />
        </div>
      </template>
    </section>

    <status-message v-else class="schedules-page__login">
      {{ $t("schedules.loginPrompt") }}
      <NuxtLink to="/login">{{ $t("header.logIn") }}</NuxtLink>
    </status-message>

    <section class="schedules-page__section" aria-labelledby="public-schedules-heading">
      <h2 id="public-schedules-heading" class="schedules-page__heading">{{ $t("schedules.public") }}</h2>

      <status-message v-if="publicError" role="alert">
        {{ $t("schedules.loadFailed") }}
        <button type="button" @click="refreshPublic()">{{ $t("feed.retry") }}</button>
      </status-message>
      <status-message v-else-if="!publicList.length">{{ $t("schedules.publicEmpty") }}</status-message>
      <template v-else>
        <div class="schedules-page__list">
          <schedule-card v-for="schedule in publicList" :key="schedule.id" v-bind="schedule" />
        </div>
        <div v-if="hasMore" class="schedules-page__more">
          <button type="button" class="schedules-page__more-button" :disabled="loadingMore" @click="loadMore">
            {{ $t(loadingMore ? "feed.loadingMore" : "schedules.showMore") }}
          </button>
        </div>
      </template>
    </section>
  </section>
</template>

<script lang="ts" setup>
const { t } = useI18n();
const { loggedIn } = useUserSession();

useHead({ title: () => t("site.pageTitle", { page: t("schedules.title") }) });

const [{ data: own, error: ownError, refresh: refreshOwn }, { data: firstPage, error: publicError, refresh: refreshPublic }] =
  await Promise.all([
    useFetch<IScheduleSummary[]>("/api/schedules", { query: { mine: 1 }, immediate: loggedIn.value, key: "own-schedules" }),
    useFetch<IScheduleSummary[]>("/api/schedules", { key: "public-schedules" }),
  ]);

const atLimit = computed(() => (own.value?.length ?? 0) >= SCHEDULE_LIMITS.perUser);

// Public schedules come a page at a time
const more = ref<IScheduleSummary[]>([]);
const publicList = computed(() => [...(firstPage.value ?? []), ...more.value]);
const hasMore = ref((firstPage.value?.length ?? 0) >= POST_PAGE_SIZE);
const loadingMore = ref(false);

async function loadMore() {
  const last = publicList.value.at(-1);
  if (!last) return;
  loadingMore.value = true;
  try {
    const page = await $fetch<IScheduleSummary[]>("/api/schedules", { query: { before: pageCursor(last) } });
    more.value.push(...page);
    hasMore.value = page.length >= POST_PAGE_SIZE;
  } finally {
    loadingMore.value = false;
  }
}
</script>

<style lang="scss" scoped>
@use "~/assets/scss/tokens" as *;
@use "~/assets/scss/mixins" as *;

.schedules-page {
  max-width: 48rem;
  margin: 0 auto;
}

.schedules-page__intro {
  margin: $space-2 0 0;
  color: $color-text-muted;
}

.schedules-page__section {
  margin-top: $space-8;
}

.schedules-page__login {
  margin: $space-6 0 0;
}

.schedules-page__section-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
}

.schedules-page__heading {
  margin: 0;
  padding-bottom: $space-2;
  font-family: $font-family-serif;
  font-size: $font-size-xl;
  font-weight: $font-weight-semibold;
  line-height: $line-height-tight;
}

.schedules-page__count {
  margin-left: $space-1;
  color: $color-text-muted;
  font-family: $font-family-sans;
  font-size: $font-size-sm;
  font-weight: $font-weight-normal;
  font-variant-numeric: tabular-nums;
}

.schedules-page__new {
  @include button;
  @include button-primary;
}

.schedules-page__note {
  margin: $space-2 0;
  color: $color-text-muted;
  font-size: $font-size-sm;
}

.schedules-page__list {
  border-top: 1px solid $color-border;
}

.schedules-page__more {
  display: flex;
  justify-content: center;
  padding: $space-6 0;
}

.schedules-page__more-button {
  @include button;
}
</style>

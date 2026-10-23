<template>
  <section class="profile-page">
    <template v-if="status === 'pending'">
      <p class="visually-hidden" role="status">{{ $t("profile.loading") }}</p>
      <post-container aria-hidden="true">
        <recipe-post-skeleton v-for="n in 2" :key="n" />
      </post-container>
    </template>

    <p v-else-if="error?.statusCode === 404" class="profile-page__message">
      {{ $t("profile.notFound") }}
      <NuxtLink to="/">{{ $t("post.backToFeed") }}</NuxtLink>
    </p>

    <p v-else-if="error" class="profile-page__message" role="alert">
      {{ $t("profile.loadFailed") }}
      <button type="button" class="profile-page__retry" @click="() => refresh()">
        {{ $t("feed.retry") }}
      </button>
    </p>

    <template v-else-if="profile">
      <profile-header
        :key="profile.user.id"
        :user="profile.user"
        :recipe-count="profile.posts.length"
        :follower-count="profile.followerCount"
        :following-count="profile.followingCount"
        :followed-by-me="profile.followedByMe"
      />

      <h2 class="profile-page__heading">{{ $t("profile.recipesHeading") }}</h2>

      <p v-if="!profile.posts.length" class="profile-page__message">
        <template v-if="isOwnProfile">
          {{ $t("profile.ownEmpty") }}
          <NuxtLink to="/create">{{ $t("profile.postFirst") }}</NuxtLink>
        </template>
        <template v-else>
          {{ $t("profile.empty", { name: profile.user.displayName }) }}
        </template>
      </p>

      <post-container>
        <recipe-post v-for="post in profile.posts" :key="post.id" v-bind="post" />
      </post-container>
    </template>
  </section>
</template>

<script lang="ts" setup>
const route = useRoute();
const { t } = useI18n();
const { user } = useUserSession();

const {
  data: profile,
  status,
  error,
  refresh,
} = useFetch<IProfile>(() => `/api/users/${route.params.handle}`, {
  lazy: true,
});

const isOwnProfile = computed(() => user.value?.id === profile.value?.user.id);

useHead({
  title: () =>
    t("site.pageTitle", {
      page: profile.value?.user.displayName ?? t("profile.title"),
    }),
});
</script>

<style scoped>
.profile-page {
  max-width: 48rem;
  margin: 0 auto;
}

.profile-page__heading {
  margin: 2.5rem 0 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
  font-family: var(--font-family-serif);
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.25;
}

.profile-page__message {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0 0 1.5rem;
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
}

.profile-page__message a,
.profile-page__retry {
  padding: 0;
  border: none;
  background: none;
  color: var(--color-primary);
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.profile-page__message a:focus-visible,
.profile-page__retry:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>

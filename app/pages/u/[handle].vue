<template>
  <section class="profile-page">
    <load-state
      :status="status"
      :error="error"
      :loading-label="$t('profile.loading')"
      :failed-label="$t('profile.loadFailed')"
      :skeletons="2"
      @retry="refresh"
    >
      <template #notFound>
        {{ $t("profile.notFound") }}
        <NuxtLink to="/">{{ $t("post.backToFeed") }}</NuxtLink>
      </template>

      <template v-if="profile">
        <profile-header
          :key="profile.user.id"
          :user="profile.user"
          :recipe-count="profile.posts.length"
          :follower-count="profile.followerCount"
          :following-count="profile.followingCount"
          :followed-by-me="profile.followedByMe"
        />

        <h2 class="profile-page__heading">{{ $t("profile.recipesHeading") }}</h2>

        <status-message v-if="!profile.posts.length">
          <template v-if="isOwnProfile">
            {{ $t("profile.ownEmpty") }}
            <NuxtLink to="/create">{{ $t("profile.postFirst") }}</NuxtLink>
          </template>
          <template v-else>
            {{ $t("profile.empty", { name: profile.user.displayName }) }}
          </template>
        </status-message>

        <post-container>
          <recipe-post v-for="post in profile.posts" :key="post.id" v-bind="post" />
        </post-container>
      </template>
    </load-state>
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
</style>

<template>
  <header class="profile-header">
    <user-circle-icon size="large" :user="user" aria-hidden="true" />

    <div class="profile-header__text">
      <h1 class="profile-header__name">{{ user.displayName }}</h1>
      <p class="profile-header__handle">@{{ user.hiddenName }}</p>
      <p v-if="user.bio" class="profile-header__bio">{{ user.bio }}</p>

      <p class="profile-header__stats">
        <span>{{ $t("profile.recipes", { n: recipeCount }, recipeCount) }}</span>
        <span>{{ $t("profile.followers", { n: followers }, followers) }}</span>
        <span>{{ $t("profile.following", { n: followingCount }) }}</span>
      </p>
    </div>

    <follow-button
      v-if="!isOwnProfile"
      class="profile-header__follow"
      :handle="user.hiddenName"
      :followed-by-me="followedByMe"
      :follower-count="followerCount"
      @change="followers = $event"
    />
  </header>
</template>

<script setup lang="ts">
const props = defineProps<{
  user: IAuthor;
  recipeCount: number;
  followerCount: number;
  followingCount: number;
  followedByMe: boolean;
}>();

const { user: viewer } = useUserSession();
const isOwnProfile = computed(() => viewer.value?.id === props.user.id);

const followers = ref(props.followerCount);
</script>

<style lang="scss" src="./styles.scss"></style>

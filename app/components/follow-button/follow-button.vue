<template>
  <button
    type="button"
    class="follow-button"
    :class="{ 'follow-button--following': following }"
    @click="toggle"
  >
    {{ $t(following ? "profile.followingButton" : "profile.follow") }}
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  handle: string;
  followedByMe: boolean;
  followerCount: number;
}>();

const emit = defineEmits<{ change: [followerCount: number] }>();

const {
  on: following,
  count: followers,
  toggle,
} = useToggle(
  "follow",
  () => `/api/users/${props.handle}/follow`,
  () => ({ on: props.followedByMe, count: props.followerCount }),
);

watch(followers, (value) => emit("change", value));
</script>

<style lang="scss" src="./styles.scss"></style>

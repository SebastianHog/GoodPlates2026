<template>
  <button
    class="like-button"
    :class="{ 'like-button--active': liked }"
    type="button"
    :aria-pressed="liked"
    :aria-label="$t(liked ? 'post.unlike' : 'post.like', { title, n: likes }, likes)"
    :disabled="disabled"
    @click="toggle"
  >
    <app-icon name="thumbs-up" class="like-button__icon" />
    <span aria-hidden="true">{{ likes }}</span>
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  postId: string;
  title: string;
  likeCount: number;
  likedByMe: boolean;
  disabled?: boolean;
}>();

const {
  on: liked,
  count: likes,
  toggle,
} = usePostToggle(
  "like",
  () => props.postId,
  () => ({ on: props.likedByMe, count: props.likeCount }),
);
</script>

<style lang="scss" src="./styles.scss"></style>

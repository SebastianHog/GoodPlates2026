<template>
  <button
    class="like-button"
    :class="{ 'like-button--active': liked }"
    type="button"
    :aria-pressed="liked"
    :aria-label="`${liked ? 'Unlike' : 'Like'} ${title}, ${likes} ${likes === 1 ? 'like' : 'likes'}`"
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
  (result) => ({ on: result.liked as boolean, count: result.likeCount as number }),
);
</script>

<style lang="scss" src="./styles.scss"></style>

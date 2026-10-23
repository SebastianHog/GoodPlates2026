<template>
  <button
    class="bookmark-button"
    :class="[`bookmark-button--${size}`, { 'bookmark-button--active': bookmarked }]"
    type="button"
    :aria-pressed="bookmarked"
    :aria-label="bookmarked ? `Remove bookmark from ${title}` : `Bookmark ${title}`"
    :title="bookmarked ? 'Remove bookmark' : 'Bookmark'"
    :disabled="disabled"
    @click="toggle"
  >
    <app-icon name="bookmark" class="bookmark-button__icon" />
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    postId: string;
    title: string;
    bookmarkedByMe: boolean;
    size?: "small" | "large";
    disabled?: boolean;
  }>(),
  { size: "small" },
);

// Lets a list react to a removed bookmark, e.g. to fade the row
const emit = defineEmits<{ change: [bookmarked: boolean] }>();

const { on: bookmarked, toggle } = usePostToggle(
  "bookmark",
  () => props.postId,
  () => ({ on: props.bookmarkedByMe, count: 0 }),
  (result) => ({ on: result.bookmarked as boolean }),
);

watch(bookmarked, (value) => emit("change", value));
</script>

<style lang="scss" src="./styles.scss"></style>

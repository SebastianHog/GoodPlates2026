<template>
  <span
    class="user-circle-icon"
    :class="[`user-circle-icon--${size}`, { 'user-circle-icon--deleted': deleted }]"
    :title="authorName(user)"
  >
    {{ deleted ? "" : user.displayName.charAt(0).toUpperCase() }}
  </span>
</template>

<script setup lang="ts">
const { user, size = "medium" } = defineProps<{
  // hiddenName is optional: pass it to show a deleted account as an empty dashed circle
  user: Pick<IAuthor, "displayName"> & { hiddenName?: string };
  size?: "small" | "medium" | "large";
}>();

const authorName = useAuthorName();
const deleted = computed(() => isDeletedAuthor(user));
</script>

<style lang="scss" src="./styles.scss"></style>

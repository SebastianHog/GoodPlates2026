<template>
  <span class="user-circle-icon" :class="`user-circle-icon--${size}`" :title="user.displayName">
    {{ user.displayName.charAt(0).toUpperCase() }}
  </span>
</template>

<script setup lang="ts">
const { user, size = "medium" } = defineProps<{
  user: Pick<IAuthor, "displayName">;
  size?: "small" | "medium" | "large";
}>();
</script>

<style lang="scss" src="./styles.scss"></style>

<template>
  <span class="user-circle-icon" :class="size" :title="user.displayName">
    {{ user.displayName.charAt(0).toUpperCase() }}
  </span>
</template>

<script setup lang="ts">
const { user, size = "medium" } = defineProps<{
  user: IAuthor;
  size?: "small" | "medium";
}>();
</script>

<style lang="scss" src="./styles.scss"></style>

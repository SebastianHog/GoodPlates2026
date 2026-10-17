<template>
  <div class="recipe-post">{{ title }}</div>
</template>

<script setup lang="ts">
import type { IPostContent } from "#shared/types/postContent";

defineProps<IPostContent>();
</script>

<style lang="scss" src="./styles.scss"></style>

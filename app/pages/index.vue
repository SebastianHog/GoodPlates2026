<template>
  <section>
    <post-container>
      <recipe-post v-for="x in 5" :key="x" v-bind="fakePost" />
    </post-container>
  </section>
</template>

<script lang="ts" setup>
import type { IPostContent } from "#shared/types/postContent";

const fakePost = {
  title: "This is a fake post",
  author: {
    displayName: "Fake User",
  },
  body: "This is a recipe I created.",
  createdAt: "2026-10-17",
  modifiedAt: "2026-10-17",
  id: "1",
} as IPostContent;
</script>

<style lang="scss">
.posts-container {
  background: red;
}
</style>

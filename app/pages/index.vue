<template>
  <section>
    <post-container>
      <recipe-post v-for="post in posts" :key="post.id" v-bind="post" />
    </post-container>
  </section>
</template>

<script lang="ts" setup>
const { data: posts } = usePosts();
</script>

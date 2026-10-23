<template>
  <!-- With a post to show: an open booklet, the post on the left and the form on the right -->
  <booklet-spread v-if="topPost" class="login-form login-form--booklet">
    <template #left>
      <featured-post :post="topPost" sizes="(min-width: 52em) 28rem, 100vw" />
    </template>
    <template #right>
      <auth-panel class="login-form__panel" />
    </template>
  </booklet-spread>

  <!-- Otherwise just the form on its own card -->
  <div v-else class="login-form login-form--card">
    <auth-panel />
  </div>
</template>

<script setup lang="ts">
// The most recent post with a photo fills the left page of the booklet
const { data: posts } = await usePosts();
const topPost = computed(() => posts.value?.find((post) => post.images.length > 0));
</script>

<style lang="scss" src="./styles.scss"></style>

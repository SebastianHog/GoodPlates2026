<template>
  <figure class="featured-post">
    <img
      v-bind="imageSources(post.images[0]!)"
      :sizes="sizes"
      :alt="post.title"
      class="featured-post__photo"
    />
    <figcaption class="featured-post__caption">
      <span class="featured-post__title">{{ post.title }}</span>
      <span class="featured-post__author">
        <user-circle-icon size="small" :user="post.author" />
        {{ post.author.displayName }}
      </span>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
// One post shown as a photo with its title and author underneath, e.g. on the login booklet
defineProps<{
  post: IPostContent;
  sizes: string;
}>();
</script>

<style lang="scss" src="./styles.scss"></style>

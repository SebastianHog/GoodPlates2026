<template>
  <div class="recipe-post">
    <div class="recipe-post__body">
      <img
        v-bind="imageSources(image)"
        sizes="(min-width: 52em) 24rem, 100vw"
        :alt="title"
        class="recipe-post__image"
        loading="lazy"
        decoding="async"
      />
    </div>
    <div class="recipe-post__header">
      <user-circle-icon size="medium" :user="author" />
      <!-- 
        TODO: date style changes,
        will probably move location of post date,
        leaving it for now, 
        change date to use unix time, 
        display month and day, 
        no year if it's posted the same year. 
      -->
      <span class="recipe-post__date-posted">{{ createdAt }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IPostContent } from "#shared/types/postContent";

defineProps<IPostContent>();

// const user = {
//   hiddenName: "username",
//   displayName: "Fake_user",
// } as IAuthor;
</script>

<style lang="scss" src="./styles.scss"></style>

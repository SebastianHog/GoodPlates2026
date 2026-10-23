<template>
  <div class="post-byline">
    <user-circle-icon size="medium" :user="author" aria-hidden="true" />
    <span class="post-byline__text">
      <span class="post-byline__name">{{ author.displayName }}</span>
      <time class="post-byline__date" :datetime="createdAt">{{
        formatPostDate(createdAt, locale)
      }}</time>
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  author: IAuthor;
  createdAt: string;
}>();

const { locale } = useI18n();
</script>

<style lang="scss" src="./styles.scss"></style>

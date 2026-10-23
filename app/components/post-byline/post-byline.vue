<template>
  <div class="post-byline">
    <user-circle-icon size="medium" :user="author" aria-hidden="true" />
    <span class="post-byline__text">
      <NuxtLink :to="`/u/${author.hiddenName}`" class="post-byline__name">
        {{ author.displayName }}
      </NuxtLink>
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

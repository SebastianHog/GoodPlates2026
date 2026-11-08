<template>
  <div class="post-byline" :class="{ 'post-byline--prominent': prominent }">
    <user-circle-icon size="medium" :user="author" aria-hidden="true" />
    <span class="post-byline__text">
      <span v-if="isDeletedAuthor(author)" class="post-byline__name post-byline__name--deleted">
        {{ authorName(author) }}
      </span>
      <NuxtLink v-else :to="`/u/${author.hiddenName}`" class="post-byline__name">
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
  // bigger avatar and name, for the post page where the author is the point (people first)
  prominent?: boolean;
}>();

const { locale } = useI18n();
const authorName = useAuthorName();
</script>

<style lang="scss" src="./styles.scss"></style>

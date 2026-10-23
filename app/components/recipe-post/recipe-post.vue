<template>
  <article class="recipe-post">
    <photo-carousel :images="images" :title="title" sizes="(min-width: 52em) 24rem, 100vw" />

    <div class="recipe-post__body">
      <h2 class="recipe-post__title">{{ title }}</h2>
      <p v-if="summary" class="recipe-post__summary">{{ summary }}</p>
    </div>

    <footer class="recipe-post__footer">
      <user-circle-icon size="medium" :user="author" />
      <span class="recipe-post__author">{{ author.displayName }}</span>
      <NuxtLink v-if="isOwnPost" :to="`/posts/${id}/edit`" class="recipe-post__edit">{{ $t("post.edit") }}</NuxtLink>

      <like-button
        class="recipe-post__like"
        :post-id="id"
        :title="title"
        :like-count="likeCount"
        :liked-by-me="likedByMe"
        :disabled="preview"
      />
      <bookmark-button :post-id="id" :title="title" :bookmarked-by-me="bookmarkedByMe" :disabled="preview" />

      <time class="recipe-post__date" :datetime="createdAt">{{ formatPostDate(createdAt, locale) }}</time>
    </footer>
  </article>
</template>

<script setup lang="ts">
// A post in the feed. `preview` is the editor's preview: the buttons show but do nothing.
const props = defineProps<IPostContent & { preview?: boolean }>();

const { user } = useUserSession();
const { t, locale } = useI18n();
const isOwnPost = computed(() => user.value?.id === props.author.id);

const summary = computed(() => formatRecipeSummary(props, t));
</script>

<style lang="scss" src="./styles.scss"></style>

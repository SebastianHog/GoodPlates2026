<template>
  <article class="recipe-post">
    <div class="recipe-post__spread">
      <div class="recipe-post__photo-page">
        <photo-carousel
          :images="images"
          :title="title"
          sizes="(min-width: 52em) 18rem, 100vw"
        />
      </div>

      <div class="recipe-post__text-page">
        <h2 class="recipe-post__title">{{ title }}</h2>
        <p v-if="summary" class="recipe-post__summary">{{ summary }}</p>
        <p v-if="caption" class="recipe-post__caption">{{ caption }}</p>

        <footer class="recipe-post__footer">
          <post-byline :author="author" :created-at="createdAt" />
          <post-actions
            :id="id"
            :title="title"
            :like-count="likeCount"
            :liked-by-me="likedByMe"
            :bookmarked-by-me="bookmarkedByMe"
            :author-id="author.id"
            :disabled="preview"
          />
        </footer>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
const props = defineProps<IPostContent & { preview?: boolean }>();

const { t } = useI18n();
const summary = computed(() => formatRecipeSummary(props, t));
</script>

<style lang="scss" src="./styles.scss"></style>

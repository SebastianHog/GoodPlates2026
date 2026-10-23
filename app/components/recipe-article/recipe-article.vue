<template>
  <article class="recipe-article">
    <booklet-spread class="recipe-article__spread">
      <template #left>
        <photo-carousel :images="images" :title="title" sizes="(min-width: 52em) 28rem, 100vw" />
      </template>

      <template #right>
        <h1 class="recipe-article__title">{{ title }}</h1>
        <p v-if="summary" class="recipe-article__summary">{{ summary }}</p>

        <div class="recipe-article__meta">
          <post-byline :author="author" :created-at="createdAt" />
          <post-actions
            :id="id"
            :title="title"
            :like-count="likeCount"
            :liked-by-me="likedByMe"
            :bookmarked-by-me="bookmarkedByMe"
            :author-id="author.id"
            share
          />
        </div>

        <p v-if="caption" class="recipe-article__caption">{{ caption }}</p>
      </template>
    </booklet-spread>

    <div v-if="ingredients.length || steps.length" class="recipe-article__recipe">
      <recipe-details :id="id" :ingredients="ingredients" :steps="steps" :servings="servings" />
    </div>

    <author-posts :author="author" :exclude-id="id" />
  </article>
</template>

<script setup lang="ts">
const props = defineProps<IPostContent>();

const { t } = useI18n();
const summary = computed(() => formatRecipeSummary(props, t));
</script>

<style lang="scss" src="./styles.scss"></style>

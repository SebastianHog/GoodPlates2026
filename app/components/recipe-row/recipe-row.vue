<template>
  <article class="recipe-row" :class="{ 'recipe-row--removed': !bookmarked }">
    <img
      v-if="images[0]"
      v-bind="imageSources(images[0])"
      sizes="8rem"
      alt=""
      class="recipe-row__image"
      loading="lazy"
      decoding="async"
    />
    <div v-else class="recipe-row__image recipe-row__image--empty" />

    <div class="recipe-row__info">
      <h2 class="recipe-row__title">{{ title }}</h2>
      <p class="recipe-row__meta">{{ meta }}</p>

      <details class="recipe-row__recipe">
        <summary class="recipe-row__toggle">Show recipe</summary>
        <recipe-details :caption="caption" :ingredients="ingredients" :steps="steps" :servings="servings" />
      </details>
    </div>

    <div class="recipe-row__actions">
      <span v-if="!bookmarked" class="recipe-row__removed" role="status">Removed</span>
      <!-- Removing keeps the row, faded, until the page is left, so a second click undoes it -->
      <bookmark-button
        size="large"
        :post-id="id"
        :title="title"
        :bookmarked-by-me="bookmarkedByMe"
        @change="bookmarked = $event"
      />
    </div>
  </article>
</template>

<script setup lang="ts">
// A bookmarked recipe as one row: photo, title, details and the bookmark toggle
const props = defineProps<IPostContent>();

const bookmarked = ref(props.bookmarkedByMe);

const meta = computed(() =>
  [props.author.displayName, formatPostDate(props.createdAt), formatRecipeSummary(props)].filter(Boolean).join(" · "),
);
</script>

<style lang="scss" src="./styles.scss"></style>

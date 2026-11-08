<template>
  <div class="recipe-article-skeleton" aria-hidden="true">
    <!-- Same booklet and recipe sheet as <recipe-article>, so nothing jumps when the post arrives -->
    <booklet-spread>
      <template #left>
        <div class="recipe-article-skeleton__photo" />
      </template>
      <template #right>
        <div class="recipe-article-skeleton__bar recipe-article-skeleton__bar--title" />
        <div class="recipe-article-skeleton__bar recipe-article-skeleton__bar--summary" />
        <div class="recipe-article-skeleton__bar" />
        <div class="recipe-article-skeleton__bar recipe-article-skeleton__bar--short" />
        <div class="recipe-article-skeleton__byline">
          <div class="recipe-article-skeleton__avatar" />
          <div class="recipe-article-skeleton__bar recipe-article-skeleton__bar--name" />
        </div>
      </template>
    </booklet-spread>

    <div class="recipe-article-skeleton__recipe">
      <div class="recipe-article-skeleton__column">
        <div class="recipe-article-skeleton__bar recipe-article-skeleton__bar--heading" />
        <div v-for="n in 4" :key="n" class="recipe-article-skeleton__row" />
      </div>
      <div class="recipe-article-skeleton__column">
        <div class="recipe-article-skeleton__bar recipe-article-skeleton__bar--heading" />
        <div v-for="n in 3" :key="n" class="recipe-article-skeleton__row recipe-article-skeleton__row--tall" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Loading placeholder for the post page
</script>

<style lang="scss" src="./styles.scss"></style>

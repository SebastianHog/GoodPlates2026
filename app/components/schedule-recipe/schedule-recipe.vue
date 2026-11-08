<template>
  <div class="schedule-recipe" :class="{ 'schedule-recipe--removed': !post }">
    <template v-if="post">
      <img
        v-if="post.images[0]"
        v-bind="imageSources(post.images[0])"
        sizes="3rem"
        alt=""
        class="schedule-recipe__photo"
        loading="lazy"
        decoding="async"
      />
      <photo-placeholder v-else class="schedule-recipe__photo" />
      <div class="schedule-recipe__text">
        <NuxtLink v-if="link" :to="`/posts/${post.id}`" class="schedule-recipe__title schedule-recipe__title--link">
          {{ post.title }}
        </NuxtLink>
        <span v-else class="schedule-recipe__title">{{ post.title }}</span>
        <span class="schedule-recipe__author">{{ post.author.displayName }}</span>
      </div>
    </template>
    <p v-else class="schedule-recipe__removed">{{ $t("schedules.recipeRemoved") }}</p>

    <div v-if="$slots.actions" class="schedule-recipe__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
// One recipe in a schedule: small photo, title and author. `post` is null when the recipe was deleted
const { link = true } = defineProps<{ post: IPostContent | null; link?: boolean }>();
</script>

<style lang="scss" src="./styles.scss"></style>

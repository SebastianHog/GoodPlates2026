<template>
  <article class="recipe-post">
    <div class="recipe-post__media">
      <div
        ref="track"
        class="recipe-post__track"
        :aria-label="images.length > 1 ? `${title}, ${images.length} photos` : undefined"
        :role="images.length > 1 ? 'region' : undefined"
        :tabindex="images.length > 1 ? 0 : undefined"
        @scroll.passive="onScroll"
      >
        <img
          v-for="(image, index) in images"
          :key="image"
          v-bind="imageSources(image)"
          sizes="(min-width: 52em) 24rem, 100vw"
          :alt="images.length > 1 ? `${title}, photo ${index + 1} of ${images.length}` : title"
          class="recipe-post__image"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div v-if="images.length > 1" class="recipe-post__dots">
        <button
          v-for="(image, index) in images"
          :key="image"
          class="recipe-post__dot"
          :class="{ 'recipe-post__dot--active': index === activePhoto }"
          type="button"
          :aria-label="`Show photo ${index + 1}`"
          :aria-current="index === activePhoto || undefined"
          @click="showPhoto(index)"
        />
      </div>
    </div>

    <div class="recipe-post__body">
      <h2 class="recipe-post__title">{{ title }}</h2>
      <p v-if="counts" class="recipe-post__counts">{{ counts }}</p>
    </div>

    <div class="recipe-post__header">
      <user-circle-icon size="medium" :user="author" />
      <span class="recipe-post__author">{{ author.displayName }}</span>
      <NuxtLink v-if="isOwnPost" :to="`/posts/${id}/edit`" class="recipe-post__edit">Edit</NuxtLink>
      <time class="recipe-post__date-posted" :datetime="createdAt">{{ formatPostDate(createdAt) }}</time>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { IPostContent } from "#shared/types/postContent";

const props = defineProps<IPostContent>();

const { user } = useUserSession();
const isOwnPost = computed(() => user.value?.id === props.author.id);

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
const counts = computed(() =>
  [
    props.ingredients.length && plural(props.ingredients.length, "ingredient"),
    props.steps.length && plural(props.steps.length, "step"),
    props.totalTimeMinutes && `${props.totalTimeMinutes} min`,
  ]
    .filter(Boolean)
    .join(" · "),
);

// Photos scroll sideways; the dots follow the scroll and jump to a photo
const track = ref<HTMLElement>();
const activePhoto = ref(0);

function onScroll() {
  const el = track.value;
  if (el) activePhoto.value = Math.round(el.scrollLeft / el.clientWidth);
}

function showPhoto(index: number) {
  const el = track.value;
  el?.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
}
</script>

<style lang="scss" src="./styles.scss"></style>

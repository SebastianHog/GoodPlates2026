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
      <button
        class="recipe-post__like"
        :class="{ 'recipe-post__like--active': liked }"
        type="button"
        :aria-pressed="liked"
        :aria-label="`${liked ? 'Unlike' : 'Like'} ${title}, ${likes} ${likes === 1 ? 'like' : 'likes'}`"
        :disabled="preview"
        @click="toggleLike"
      >
        <svg class="recipe-post__like-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3Z" />
          <path
            d="M7 10l4.2-7.4A1.8 1.8 0 0 1 14.6 3.7L13.8 8h5.4a2 2 0 0 1 2 2.4l-1.6 8.4A2 2 0 0 1 17.6 21H7"
          />
        </svg>
        <span aria-hidden="true">{{ likes }}</span>
      </button>
      <time class="recipe-post__date-posted" :datetime="createdAt">{{ formatPostDate(createdAt) }}</time>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { IPostContent } from "#shared/types/postContent";

// `preview` is the editor's preview: the like button shows but does nothing
const props = defineProps<IPostContent & { preview?: boolean }>();

const { user, loggedIn } = useUserSession();
const isOwnPost = computed(() => user.value?.id === props.author.id);

// Likes update right away and roll back if the server says no
const liked = ref(props.likedByMe);
const likes = ref(props.likeCount);
watch(
  () => [props.likedByMe, props.likeCount] as const,
  ([likedByMe, likeCount]) => {
    liked.value = likedByMe;
    likes.value = likeCount;
  },
);

let likeRequest = 0;

async function toggleLike() {
  if (!loggedIn.value) {
    await navigateTo("/login");
    return;
  }

  const next = !liked.value;
  const before = { liked: liked.value, likes: likes.value };
  liked.value = next;
  likes.value += next ? 1 : -1;

  // Only the latest click's answer counts when someone clicks quickly
  const request = ++likeRequest;
  try {
    const result = await $fetch(`/api/posts/${props.id}/like`, { method: next ? "PUT" : "DELETE" });
    if (request === likeRequest) {
      liked.value = result.liked;
      likes.value = result.likeCount;
    }
  } catch {
    if (request === likeRequest) {
      liked.value = before.liked;
      likes.value = before.likes;
    }
  }
}

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

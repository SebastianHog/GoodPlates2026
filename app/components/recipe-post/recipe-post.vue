<template>
  <article class="recipe-post" :class="{ 'recipe-post--preview': preview }">
    <div class="recipe-post__spread">
      <div class="recipe-post__photo-page" @click="openFromPhoto">
        <photo-carousel
          :images="images"
          :title="title"
          sizes="(min-width: 52em) 18rem, 100vw"
        />
      </div>

      <div class="recipe-post__text-page">
        <h2 class="recipe-post__title">
          <NuxtLink v-if="!preview" :to="postUrl" class="recipe-post__link">
            {{ title }}
          </NuxtLink>
          <template v-else>{{ title }}</template>
        </h2>
        <p v-if="summary" class="recipe-post__summary">{{ summary }}</p>
        <p v-if="caption" class="recipe-post__caption">{{ caption }}</p>

        <footer class="recipe-post__footer">
          <post-byline
            class="recipe-post__byline"
            :author="author"
            :created-at="createdAt"
          />
          <post-actions
            class="recipe-post__actions"
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
const postUrl = computed(() => `/posts/${props.id}`);

function openFromPhoto(event: MouseEvent) {
  const onPhoto = (event.target as HTMLElement).tagName === "IMG";
  if (!props.preview && onPhoto) navigateTo(postUrl.value);
}
</script>

<style lang="scss" src="./styles.scss"></style>

<template>
  <section v-if="others.length" class="author-posts">
    <h2 class="author-posts__heading">
      <NuxtLink :to="`/u/${author.hiddenName}`" class="author-posts__heading-link">
        {{ $t("post.moreFrom", { name: author.displayName }) }}
      </NuxtLink>
    </h2>
    <ul class="author-posts__list">
      <li v-for="post in others" :key="post.id">
        <NuxtLink :to="`/posts/${post.id}`" class="author-posts__link">
          <img
            v-bind="imageSources(post.images[0]!)"
            sizes="(min-width: 52em) 18rem, 33vw"
            alt=""
            class="author-posts__photo"
            loading="lazy"
            decoding="async"
          />
          <span class="author-posts__title">{{ post.title }}</span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
// Up to 3 other posts by the same author
const props = defineProps<{
  author: IAuthor;
  excludeId: string;
}>();

// 4, so there are still 3 when one of them is the post being shown
const { data: posts } = useFetch<IPostContent[]>("/api/posts", {
  query: { author: props.author.id, limit: 4 },
  key: `author-posts-${props.author.id}`,
  lazy: true,
});

const others = computed(
  () => posts.value?.filter((post) => post.id !== props.excludeId).slice(0, 3) ?? [],
);
</script>

<style lang="scss" src="./styles.scss"></style>

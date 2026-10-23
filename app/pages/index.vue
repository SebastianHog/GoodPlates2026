<template>
  <section>
    <p v-if="search" class="search-summary">
      {{ posts?.length ? `Recipes matching “${search}”` : `No recipes match “${search}”.` }}
      <NuxtLink to="/">Show all</NuxtLink>
    </p>
    <post-container>
      <recipe-post v-for="post in posts" :key="post.id" v-bind="post" />
    </post-container>
  </section>
</template>

<script lang="ts" setup>
const route = useRoute();
const search = computed(() => (typeof route.query.q === "string" && route.query.q.trim()) || undefined);

const { data: posts } = await usePosts(search);
</script>

<style scoped>
.search-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0 0 1.5rem;
  color: var(--color-text-muted);
}

.search-summary a {
  color: var(--color-primary);
}
</style>

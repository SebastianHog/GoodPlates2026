<template>
  <form class="search-field" role="search" @submit.prevent="search">
    <label class="visually-hidden" for="site-search">Search recipes</label>
    <app-icon name="search" class="search-field__icon" />
    <input
      id="site-search"
      v-model="query"
      class="search-field__input"
      type="search"
      name="q"
      placeholder="Search recipes"
      enterkeyhint="search"
      maxlength="100"
    />
  </form>
</template>

<script setup lang="ts">
// Recipe search: submitting shows the feed filtered by ?q=
const route = useRoute();

const query = ref(typeof route.query.q === "string" ? route.query.q : "");

// Keep the field in step with the URL, e.g. after "Show all" or the back button
watch(
  () => route.query.q,
  (q) => (query.value = typeof q === "string" ? q : ""),
);

function search() {
  const q = query.value.trim();
  navigateTo({ path: "/", query: q ? { q } : {} });
}
</script>

<style lang="scss" src="./styles.scss"></style>

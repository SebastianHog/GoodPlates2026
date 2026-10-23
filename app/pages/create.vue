<template>
  <section>
    <h1 class="create-page__title">New recipe</h1>
    <post-editor />
  </section>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: "auth" });

useHead({ title: "New recipe · GoodPlates" });
</script>

<style scoped>
.create-page__title {
  max-width: 72rem;
  margin: 0 auto 1.5rem;
  font-size: 1.5rem;
}
</style>

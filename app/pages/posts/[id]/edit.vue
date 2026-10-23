<template>
  <section>
    <h1 class="edit-page__title">Edit recipe</h1>
    <p v-if="error" class="edit-page__message">This recipe could not be found.</p>
    <p v-else-if="post && post.author.id !== user?.id" class="edit-page__message">
      You can only edit your own recipes.
    </p>
    <post-editor v-else-if="post" :post="post" />
  </section>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: "auth" });

const route = useRoute();
const { user } = useUserSession();
const { data: post, error } = await useFetch<IPostContent>(`/api/posts/${route.params.id}`);

useHead({ title: () => `Edit ${post.value?.title ?? "recipe"} · GoodPlates` });
</script>

<style scoped>
.edit-page__title {
  max-width: 72rem;
  margin: 0 auto 1.5rem;
  font-size: 1.5rem;
}

.edit-page__message {
  color: var(--color-text-muted);
}
</style>

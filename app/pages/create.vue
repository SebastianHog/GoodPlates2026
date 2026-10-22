<template>
  <section>
    <h1>Create post</h1>
    <form @submit.prevent="submit">
      <p>
        <label>Title <input v-model="title" required /></label>
      </p>
      <p>
        <label>Image URL <input v-model="image" /></label>
      </p>
      <p>
        <label>Body <textarea v-model="body" required /></label>
      </p>
      <p v-if="error">{{ error }}</p>
      <button type="submit" :disabled="pending">Post</button>
    </form>
  </section>
</template>

<script lang="ts" setup>
const title = ref("");
const body = ref("");
const image = ref("");
const pending = ref(false);
const error = ref("");

async function submit() {
  pending.value = true;
  error.value = "";
  try {
    await $fetch("/api/posts", {
      method: "POST",
      body: { title: title.value, body: body.value, image: image.value },
    });
    await navigateTo("/");
  } catch {
    error.value = "Could not create post";
  } finally {
    pending.value = false;
  }
}
</script>

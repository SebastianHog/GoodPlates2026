<template>
  <section>
    <h1>Create post</h1>
    <form @submit.prevent="submit">
      <p>
        <label>Title <input v-model="title" required /></label>
      </p>
      <p>
        <label>
          Photo
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" @change="upload" />
        </label>
        <span v-if="uploading"> Uploading…</span>
      </p>
      <p v-if="image">
        <img v-bind="imageSources(image)" sizes="20rem" alt="Uploaded photo" width="320" />
      </p>
      <p>
        <label>Body <textarea v-model="body" required /></label>
      </p>
      <p v-if="error">{{ error }}</p>
      <button type="submit" :disabled="pending || uploading">Post</button>
    </form>
  </section>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: "auth" });

const title = ref("");
const body = ref("");
const image = ref("");
const uploading = ref(false);
const pending = ref(false);
const error = ref("");

async function upload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  uploading.value = true;
  error.value = "";
  try {
    const form = new FormData();
    form.append("image", file);
    const { key } = await $fetch("/api/uploads", { method: "POST", body: form });
    image.value = key;
  } catch (e) {
    image.value = "";
    error.value = (e as { statusMessage?: string }).statusMessage ?? "Could not upload photo";
  } finally {
    uploading.value = false;
  }
}

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

<template>
  <div class="post-actions">
    <NuxtLink
      v-if="isOwnPost"
      :to="`/posts/${id}/edit`"
      class="post-actions__edit"
      >{{ $t("post.edit") }}</NuxtLink
    >
    <like-button
      :post-id="id"
      :title="title"
      :like-count="likeCount"
      :liked-by-me="likedByMe"
      :disabled="disabled"
    />
    <bookmark-button
      :post-id="id"
      :title="title"
      :bookmarked-by-me="bookmarkedByMe"
      :disabled="disabled"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<
  Pick<
    IPostContent,
    "id" | "title" | "likeCount" | "likedByMe" | "bookmarkedByMe"
  > & {
    authorId: string;
    disabled?: boolean;
  }
>();

const { user } = useUserSession();
const isOwnPost = computed(() => user.value?.id === props.authorId);
</script>

<style lang="scss" src="./styles.scss"></style>

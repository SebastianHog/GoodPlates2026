<template>
  <article class="comment-item" :class="{ 'comment-item--reply': reply }">
    <user-circle-icon :size="reply ? 'small' : 'medium'" :user="comment.author" aria-hidden="true" />

    <div class="comment-item__main">
      <header class="comment-item__header">
        <NuxtLink v-if="comment.author.hiddenName" :to="`/u/${comment.author.hiddenName}`" class="comment-item__name">
          {{ comment.author.displayName }}
        </NuxtLink>
        <span v-else class="comment-item__name">{{ comment.author.displayName }}</span>
        <span v-if="comment.author.id === postAuthorId" class="comment-item__badge">
          {{ $t("comments.authorBadge") }}
        </span>
        <time class="comment-item__date" :datetime="comment.createdAt">
          {{ formatPostDate(comment.createdAt, locale) }}
        </time>
      </header>

      <p class="comment-item__body">{{ comment.body }}</p>

      <div class="comment-item__actions">
        <button
          v-if="!reply"
          type="button"
          class="comment-item__action"
          :aria-label="$t('comments.replyTo', { name: comment.author.displayName })"
          @click="emit('reply')"
        >
          {{ $t("comments.reply") }}
        </button>
        <button
          v-if="canDelete"
          type="button"
          class="comment-item__action comment-item__action--delete"
          :disabled="deleting"
          @click="emit('delete')"
        >
          {{ $t(deleting ? "comments.deleting" : "comments.delete") }}
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
// One comment or reply: who wrote it, when, the text, and Reply / Delete
defineProps<{
  comment: IComment;
  postAuthorId: string;
  canDelete: boolean;
  deleting?: boolean;
  reply?: boolean;
}>();

const emit = defineEmits<{ reply: []; delete: [] }>();

const { locale } = useI18n();
</script>

<style lang="scss" src="./styles.scss"></style>

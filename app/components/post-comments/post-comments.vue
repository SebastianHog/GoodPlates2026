<template>
  <section id="comments" class="post-comments" :aria-labelledby="headingId">
    <h2 :id="headingId" class="post-comments__heading">{{ $t("comments.title") }}</h2>

    <comment-form
      v-if="loggedIn"
      class="post-comments__new"
      :label="$t('comments.label')"
      :placeholder="$t('comments.placeholder')"
      :send="addComment"
    />
    <status-message v-else>
      {{ $t("comments.loginPrompt") }}
      <NuxtLink :to="loginUrl">{{ $t("comments.logIn") }}</NuxtLink>
    </status-message>

    <status-message v-if="error && !threads.length">
      {{ $t("comments.loadFailed") }}
      <button type="button" @click="() => refresh()">{{ $t("comments.retry") }}</button>
    </status-message>
    <status-message v-else-if="!data">{{ $t("comments.loading") }}</status-message>
    <status-message v-else-if="!threads.length">{{ $t("comments.empty") }}</status-message>

    <ol v-if="threads.length" class="post-comments__list">
      <li v-for="thread in threads" :key="thread.id" class="post-comments__thread">
        <comment-item
          :comment="thread"
          :post-author-id="postAuthorId"
          :can-delete="canDelete(thread)"
          :deleting="deletingId === thread.id"
          @reply="openReply(thread)"
          @delete="remove(thread)"
        />

        <ol v-if="thread.replies.length || replyingTo?.threadId === thread.id" class="post-comments__replies">
          <li v-for="reply in thread.replies" :key="reply.id">
            <comment-item
              :comment="reply"
              :post-author-id="postAuthorId"
              :can-delete="canDelete(reply)"
              :deleting="deletingId === reply.id"
              reply
              @delete="remove(reply, thread)"
            />
          </li>
          <li v-if="replyingTo?.threadId === thread.id">
            <comment-form
              :key="replyingTo.key"
              :label="$t('comments.replyLabel', { name: replyingTo.name })"
              :placeholder="$t('comments.replyPlaceholder', { name: replyingTo.name })"
              :send="(body) => addReply(thread, body)"
              reply
              autofocus
              @cancel="replyingTo = null"
            />
          </li>
        </ol>
      </li>
    </ol>

    <show-more :has-more="hasMore" :loading="loadingMore" :label="$t('comments.showMore')" @more="loadMore" />
  </section>
</template>

<script setup lang="ts">
// The comments under a recipe: newest top comments first, each with its replies (one level deep) oldest first
const props = defineProps<{
  postId: string;
  postAuthorId: string;
}>();

const { loggedIn, user } = useUserSession();
const route = useRoute();
const { t } = useI18n();
const { show: showToast } = useToast();
const headingId = useId();

const url = computed(() => `/api/posts/${props.postId}/comments`);
const loginUrl = computed(() => `/login?redirect=${encodeURIComponent(`${route.path}#comments`)}`);

const { data, error, refresh } = useFetch<ICommentThread[]>(url, {
  query: { limit: COMMENT_PAGE_SIZE },
  key: `comments-${props.postId}`,
  lazy: true,
});

// A local copy, so new and deleted comments show without fetching the list again
const threads = ref<ICommentThread[]>([]);
const lastPageFull = ref(false);

watch(
  data,
  (page) => {
    threads.value = page ? page.map((thread) => ({ ...thread, replies: [...thread.replies] })) : [];
    lastPageFull.value = (page?.length ?? 0) >= COMMENT_PAGE_SIZE;
  },
  { immediate: true },
);

function canDelete(comment: IComment) {
  const me = user.value?.id;
  // Commenters can delete their own; the recipe's author can tidy up under their post
  return !!me && (me === comment.author.id || me === props.postAuthorId);
}

function errorKey(e: unknown) {
  return (e as { data?: { data?: { messageKey?: string } } }).data?.data?.messageKey;
}

// Writing

async function send(body: string, parentId: string | null) {
  try {
    return await $fetch<IComment>(url.value, {
      method: "POST",
      body: { body, parentId } satisfies CommentInput,
    });
  } catch (e) {
    showToast(t(errorKey(e) ?? "comments.postFailed", COMMENT_LIMITS));
    throw e;
  }
}

async function addComment(body: string) {
  const comment = await send(body, null);
  threads.value.unshift({ ...comment, replies: [] });
}

// Only top comments can be replied to, as replies go one level deep
const replyingTo = ref<{ threadId: string; name: string; key: number } | null>(null);

function openReply(thread: ICommentThread) {
  if (!loggedIn.value) {
    showToast(t("comments.replyLogin"), { tone: "info", action: { label: t("toast.logIn"), to: loginUrl.value } });
    return;
  }
  replyingTo.value = { threadId: thread.id, name: thread.author.displayName, key: Date.now() };
}

async function addReply(thread: ICommentThread, body: string) {
  try {
    thread.replies.push(await send(body, thread.id));
    replyingTo.value = null;
  } catch (e) {
    // Someone deleted the comment meanwhile, so the thread is gone
    if (errorKey(e) === "comments.errors.commentMissing") dropLocally(thread);
    throw e;
  }
}

// Deleting

const deletingId = ref<string | null>(null);

// Takes a comment off the page; a top comment takes its replies (and an open reply box) with it
function dropLocally(comment: IComment, thread?: ICommentThread) {
  if (thread) {
    thread.replies = thread.replies.filter((reply) => reply.id !== comment.id);
    return;
  }
  threads.value = threads.value.filter((top) => top.id !== comment.id);
  if (replyingTo.value?.threadId === comment.id) replyingTo.value = null;
}

async function remove(comment: IComment, thread?: ICommentThread) {
  const hasReplies = !thread && (comment as ICommentThread).replies.length > 0;
  if (!window.confirm(t(hasReplies ? "comments.deleteThreadConfirm" : "comments.deleteConfirm"))) return;

  deletingId.value = comment.id;
  try {
    await $fetch(`${url.value}/${comment.id}`, { method: "DELETE" });
    dropLocally(comment, thread);
    showToast(t("comments.deleted"), { tone: "info" });
  } catch (e) {
    const key = errorKey(e);
    // Already gone (deleted elsewhere): what was asked for has happened
    if (key === "comments.errors.commentMissing") dropLocally(comment, thread);
    else showToast(t(key ?? "comments.deleteFailed"));
  } finally {
    deletingId.value = null;
  }
}

// More pages of top comments

const loadingMore = ref(false);
const hasMore = computed(() => lastPageFull.value && threads.value.length > 0);

async function loadMore() {
  const last = threads.value.at(-1);
  if (!last || loadingMore.value) return;

  loadingMore.value = true;
  try {
    const page = await $fetch<ICommentThread[]>(url.value, {
      query: { limit: COMMENT_PAGE_SIZE, before: commentCursor(last) },
    });
    // Skip any already shown, e.g. after deleting one moved the cursor
    const shown = new Set(threads.value.map((top) => top.id));
    threads.value.push(...page.filter((top) => !shown.has(top.id)));
    lastPageFull.value = page.length >= COMMENT_PAGE_SIZE;
  } catch {
    showToast(t("comments.loadMoreFailed"));
  } finally {
    loadingMore.value = false;
  }
}
</script>

<style lang="scss" src="./styles.scss"></style>

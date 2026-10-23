<template>
  <button
    type="button"
    class="share-button"
    :aria-label="$t('post.shareLabel', { title })"
    :title="$t('post.share')"
    @click="share"
  >
    <app-icon name="share" class="share-button__icon" />
  </button>
</template>

<script setup lang="ts">
// Use the phone's share sheet if there is one, otherwise copy the link
const props = defineProps<{
  postId: string;
  title: string;
}>();

const { t } = useI18n();
const { show: showToast } = useToast();

async function share() {
  const url = new URL(`/posts/${props.postId}`, window.location.origin).href;

  if (navigator.share) {
    // closing the share sheet also rejects, ignore it
    await navigator.share({ title: props.title, url }).catch(() => {});
    return;
  }

  try {
    await navigator.clipboard.writeText(url);
    showToast(t("post.linkCopied"), { tone: "info" });
  } catch {
    showToast(t("post.copyFailed"));
  }
}
</script>

<style lang="scss" src="./styles.scss"></style>

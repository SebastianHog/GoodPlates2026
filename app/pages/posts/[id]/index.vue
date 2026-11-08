<template>
  <section class="post-page">
    <load-state
      :status="status"
      :error="error"
      :loading-label="$t('post.loading')"
      :failed-label="$t('post.loadFailed')"
      @retry="refresh"
    >
      <template #skeleton>
        <recipe-article-skeleton />
      </template>
      <recipe-article v-if="post" v-bind="post" />
    </load-state>
  </section>
</template>

<script lang="ts" setup>
const route = useRoute();
const { t } = useI18n();
const authorName = useAuthorName();

const request = useFetch<IPostContent>(() => `/api/posts/${route.params.id}`, {
  lazy: true,
});
const { data: post, status, error, refresh } = request;

// A missing recipe gets the site's "Page not found" page and a real 404 status, so search engines drop the link.
// On the server the watcher below doesn't run, so check once the fetch has finished.
const notFound = () => createError({ statusCode: 404, statusMessage: "Recipe not found", fatal: true });

onServerPrefetch(async () => {
  await request;
  if (error.value?.statusCode === 404) throw notFound();
});

watch(error, (e) => {
  if (e?.statusCode === 404) showError(notFound());
});

useWakeLock();

useHead({
  title: () =>
    t("site.pageTitle", { page: post.value?.title ?? t("feed.title") }),
});

const origin = useSiteOrigin();

const description = computed(() => {
  if (!post.value) return undefined;
  const caption = post.value.caption.replace(/\s+/g, " ").trim();
  if (caption) return truncate(caption, 160);
  return t("post.previewDescription", {
    name: authorName(post.value.author),
    ingredients: t("post.summary.ingredients", post.value.ingredients.length),
    steps: t("post.summary.steps", post.value.steps.filter((step) => !isStepNote(step)).length),
  });
});

// Read here, not inside the computed: head tags are resolved after setup, where composables can't run
const { imageBaseUrl } = useRuntimeConfig().public;
const coverUrl = computed(() => {
  const cover = post.value?.images[0];
  return cover
    ? new URL(`${imageBaseUrl}/${cover}-800.webp`, origin).href
    : undefined;
});

useSeoMeta({
  description,
  ogType: "article",
  ogSiteName: "GoodPlates",
  ogTitle: () => post.value?.title,
  ogDescription: description,
  ogUrl: () => new URL(route.path, origin).href,
  ogImage: coverUrl,
  ogImageType: () => (coverUrl.value ? "image/webp" : undefined),
  ogImageAlt: () => post.value?.title,
  twitterCard: "summary_large_image",
});

// Cuts at a word boundary so previews don't end mid-word
function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s.,;:!?-]+$/, "")}…`;
}
</script>

<style scoped>
.post-page {
  max-width: 60rem;
  margin: 0 auto;
}
</style>

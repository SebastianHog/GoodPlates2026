<template>
  <form class="post-editor" novalidate @submit.prevent="submit">
    <booklet-spread class="post-editor__booklet">
      <template #left>
        <photo-picker
          v-model="photos"
          input-id="post-images"
          :error="errors.images && $t(errors.images, POST_LIMITS)"
        />
      </template>

      <!-- Right page: the recipe, or a preview of the feed card -->
      <template #right>
        <section class="post-editor__recipe" :aria-label="$t('editor.recipe')">
          <div v-if="restoredDraft" class="post-editor__notice" role="status">
            {{ $t("editor.draftRestored") }}
            <button
              class="post-editor__link"
              type="button"
              @click="discardDraft"
            >
              {{ $t("editor.startOver") }}
            </button>
          </div>

          <template v-if="!showPreview">
            <div class="post-editor__field">
              <label class="visually-hidden" for="post-title">{{
                $t("editor.title")
              }}</label>
              <input
                id="post-title"
                v-model="title"
                class="post-editor__title"
                type="text"
                :placeholder="$t('editor.titlePlaceholder')"
                :maxlength="POST_LIMITS.title"
                :aria-invalid="!!errors.title || undefined"
                aria-describedby="post-title-error"
              />
              <p
                v-if="errors.title"
                id="post-title-error"
                class="post-editor__field-error"
              >
                {{ $t(errors.title, POST_LIMITS) }}
              </p>
            </div>

            <div class="post-editor__field">
              <label class="visually-hidden" for="post-caption">{{
                $t("editor.description")
              }}</label>
              <textarea
                id="post-caption"
                ref="captionField"
                v-model="caption"
                class="post-editor__caption"
                rows="3"
                :placeholder="$t('editor.descriptionPlaceholder')"
                :maxlength="POST_LIMITS.caption"
                :aria-invalid="!!errors.caption || undefined"
                aria-describedby="post-caption-error"
                @input="fitToContent(captionField)"
              />
              <p
                v-if="errors.caption"
                id="post-caption-error"
                class="post-editor__field-error"
              >
                {{ $t(errors.caption, POST_LIMITS) }}
              </p>
            </div>

            <div class="post-editor__details">
              <div class="post-editor__detail">
                <label class="post-editor__label" for="post-servings">{{
                  $t("editor.servings")
                }}</label>
                <input
                  id="post-servings"
                  v-model="servings"
                  class="post-editor__input"
                  type="text"
                  :placeholder="$t('editor.servingsPlaceholder')"
                  :maxlength="POST_LIMITS.servings"
                />
              </div>
              <div class="post-editor__detail">
                <label class="post-editor__label" for="post-time">{{
                  $t("editor.totalTime")
                }}</label>
                <div class="post-editor__suffixed">
                  <input
                    id="post-time"
                    v-model.number="totalTime"
                    class="post-editor__input"
                    type="number"
                    inputmode="numeric"
                    min="1"
                    :max="POST_LIMITS.totalTimeMinutes"
                    :aria-invalid="!!errors.totalTimeMinutes || undefined"
                    aria-describedby="post-time-error"
                  />
                  <span class="post-editor__suffix" aria-hidden="true">{{
                    $t("editor.minutes")
                  }}</span>
                </div>
                <p
                  v-if="errors.totalTimeMinutes"
                  id="post-time-error"
                  class="post-editor__field-error"
                >
                  {{ $t(errors.totalTimeMinutes, POST_LIMITS) }}
                </p>
              </div>
            </div>

            <div class="post-editor__lists">
              <div class="post-editor__list">
                <h3 class="post-editor__label">
                  {{ $t("editor.ingredients") }}
                </h3>
                <list-editor
                  v-model="ingredients"
                  id-prefix="post-ingredients"
                  :item-label="$t('editor.ingredient')"
                  :add-label="$t('editor.addIngredient')"
                  :placeholder="$t('editor.ingredientPlaceholder')"
                  :max="POST_LIMITS.ingredients"
                  :invalid="!!errors.ingredients"
                  describedby="post-ingredients-error"
                />
                <p
                  v-if="errors.ingredients"
                  id="post-ingredients-error"
                  class="post-editor__field-error"
                >
                  {{ $t(errors.ingredients, POST_LIMITS) }}
                </p>
              </div>

              <div class="post-editor__list">
                <h3 class="post-editor__label">{{ $t("editor.steps") }}</h3>
                <list-editor
                  v-model="steps"
                  id-prefix="post-steps"
                  :item-label="$t('editor.step')"
                  :add-label="$t('editor.addStep')"
                  :placeholder="$t('editor.stepPlaceholder')"
                  :max="POST_LIMITS.steps"
                  numbered
                  multiline
                  :invalid="!!errors.steps"
                  describedby="post-steps-error"
                />
                <p
                  v-if="errors.steps"
                  id="post-steps-error"
                  class="post-editor__field-error"
                >
                  {{ $t(errors.steps, POST_LIMITS) }}
                </p>
              </div>
            </div>
          </template>

          <div v-else class="post-editor__preview">
            <h2 class="post-editor__label">
              {{ $t("editor.previewHeading") }}
            </h2>
            <recipe-post v-bind="previewPost" preview />
          </div>

          <p v-if="submitError" class="post-editor__error" role="alert">
            {{ submitError }}
          </p>

          <div class="post-editor__footer">
            <span class="post-editor__status" aria-live="polite">{{
              statusText
            }}</span>
            <div class="post-editor__buttons">
              <NuxtLink v-if="post" :to="'/'" class="post-editor__button">{{
                $t("editor.discardChanges")
              }}</NuxtLink>
              <button
                class="post-editor__button"
                type="button"
                @click="showPreview = !showPreview"
              >
                {{
                  $t(showPreview ? "editor.backToEditing" : "editor.preview")
                }}
              </button>
              <button
                class="post-editor__button post-editor__button--primary"
                type="submit"
                :disabled="pending || uploading"
              >
                {{ submitLabel }}
              </button>
            </div>
          </div>

          <div v-if="post" class="post-editor__delete-row">
            <button
              class="post-editor__delete"
              type="button"
              :disabled="deleting"
              @click="deletePost"
            >
              {{ $t(deleting ? "editor.deleting" : "editor.delete") }}
            </button>
          </div>
        </section>
      </template>
    </booklet-spread>
  </form>
</template>

<script setup lang="ts">
import type { PostDraftContent } from "~/composables/usePostDraft";
import type { EditorPhoto } from "~/utils/editorPhoto";

// Creates a new post, or edits `post`. New posts are kept as a draft in this browser until posted.
const props = defineProps<{ post?: IPostContent }>();

const { user } = useUserSession();
const { t } = useI18n();
const draft = usePostDraft();

// Form fields

const photos = ref<EditorPhoto[]>([]);
const title = ref("");
const caption = ref("");
const servings = ref("");
const totalTime = ref<number | "">("");
const ingredients = ref<string[]>([""]);
const steps = ref<string[]>([""]);

const captionField = ref<HTMLTextAreaElement>();

// Form state

const errors = ref<Partial<Record<PostField, string>>>({});
const submitError = ref("");
const pending = ref(false);
const submitted = ref(false);
const showPreview = ref(false);
const dirty = ref(false);
const restoredDraft = ref(false);

const uploading = computed(() =>
  photos.value.some((photo) => photo.status === "uploading"),
);
const uploadedKeys = computed(() =>
  photos.value
    .filter((photo) => photo.status === "done")
    .map((photo) => photo.key),
);

const submitLabel = computed(() => {
  if (pending.value) return t(props.post ? "editor.saving" : "editor.posting");
  if (uploading.value) return t("editor.uploadingPhotos");
  return t(props.post ? "editor.save" : "editor.post");
});

const statusText = computed(() => {
  if (props.post || !draft.savedAt.value) return "";
  const time = draft.savedAt.value.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return t("editor.draftSaved", { time });
});

// what gets sent to the server, and what a draft stores

const input = computed<PostInput>(() => ({
  title: title.value,
  caption: caption.value,
  images: uploadedKeys.value,
  ingredients: ingredients.value,
  steps: steps.value,
  servings: servings.value,
  totalTimeMinutes: totalTime.value === "" ? null : totalTime.value,
}));

const draftContent = (): PostDraftContent => ({
  ...input.value,
  totalTime: totalTime.value,
});

// The post as the feed card will show it, for Preview
const previewPost = computed<IPostContent>(() => {
  const now = new Date().toISOString();
  const author: IAuthor = props.post?.author ?? {
    id: user.value?.id ?? "",
    displayName: user.value?.displayName ?? "",
    hiddenName: user.value?.hiddenName ?? "",
    bio: "",
    createdAt: now,
    modifiedAt: now,
  };
  const lines = (list: string[]) =>
    list.map((line) => line.trim()).filter(Boolean);

  return {
    ...input.value,
    id: props.post?.id ?? "preview",
    author,
    title: title.value.trim() || t("editor.previewTitle"),
    ingredients: lines(ingredients.value),
    steps: lines(steps.value),
    likeCount: props.post?.likeCount ?? 0,
    likedByMe: false,
    cookCount: props.post?.cookCount ?? 0,
    cookedByMe: false,
    bookmarkedByMe: false,
    createdAt: props.post?.createdAt ?? now,
    modifiedAt: now,
  };
});

// Filling the form

function load(source: PostDraftContent) {
  photos.value = source.images.map(photoFromKey);
  title.value = source.title;
  caption.value = source.caption;
  servings.value = source.servings;
  totalTime.value = source.totalTime;
  ingredients.value = source.ingredients.length
    ? [...source.ingredients]
    : [""];
  steps.value = source.steps.length ? [...source.steps] : [""];
}

// After filling the form, nothing counts as changed yet
function markClean() {
  nextTick(() => {
    dirty.value = false;
    fitToContent(captionField.value);
  });
}

if (props.post) {
  load({ ...props.post, totalTime: props.post.totalTimeMinutes ?? "" });
}

onMounted(() => {
  const saved = props.post ? null : draft.read();
  if (saved) {
    load(saved);
    restoredDraft.value = true;
  }
  markClean();
});

function discardDraft() {
  draft.clear();
  restoredDraft.value = false;
  load({
    title: "",
    caption: "",
    images: [],
    ingredients: [],
    steps: [],
    servings: "",
    totalTime: "",
  });
  markClean();
}

watch(
  [title, caption, servings, totalTime, ingredients, steps, uploadedKeys],
  () => {
    dirty.value = true;
    if (!props.post && !submitted.value) draft.saveSoon(draftContent);
  },
  { deep: true },
);

// Leaving the page: drafts keep new posts safe, but edits and running uploads would be lost

function hasUnsavedWork() {
  return !submitted.value && ((props.post && dirty.value) || uploading.value);
}

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (hasUnsavedWork()) event.preventDefault();
}

onMounted(() => window.addEventListener("beforeunload", onBeforeUnload));
onBeforeUnmount(() =>
  window.removeEventListener("beforeunload", onBeforeUnload),
);

onBeforeRouteLeave(() => {
  if (hasUnsavedWork() && !window.confirm(t("editor.leaveConfirm"))) {
    return false;
  }
});

// Submitting

// Where to send the cursor for each field that can have a problem, in page order
const fieldTargets: Partial<Record<PostField, string>> = {
  images: "post-images",
  title: "post-title",
  caption: "post-caption",
  totalTimeMinutes: "post-time",
  ingredients: "post-ingredients-0",
  steps: "post-steps-0",
};

function focusFirstError() {
  const first = (Object.keys(fieldTargets) as PostField[]).find(
    (field) => errors.value[field],
  );
  if (!first) return;

  const target = document.getElementById(fieldTargets[first]!);
  // With photos already added there is no drop zone to focus, so scroll to the photos instead
  const fallback =
    first === "images"
      ? document.querySelector<HTMLElement>(".photo-picker")
      : null;
  (target ?? fallback)?.scrollIntoView({
    behavior: scrollBehavior(),
    block: "center",
  });
  target?.focus({ preventScroll: true });
}

// Deleting (edit only): asks first, then goes to your profile
const { show: showToast } = useToast();
const deleting = ref(false);

async function deletePost() {
  if (!props.post || !window.confirm(t("editor.deleteConfirm"))) return;

  deleting.value = true;
  try {
    await $fetch(`/api/posts/${props.post.id}`, { method: "DELETE" });
    submitted.value = true;
    showToast(t("editor.deleted"), { tone: "info" });
    await navigateTo(user.value ? `/u/${user.value.hiddenName}` : "/");
  } catch {
    showToast(t("editor.deleteFailed"));
  } finally {
    deleting.value = false;
  }
}

async function submit() {
  submitError.value = "";
  showPreview.value = false;

  if (photos.value.some((photo) => photo.status === "error")) {
    errors.value = { images: "editor.photoFailed" };
    nextTick(focusFirstError);
    return;
  }

  const result = validatePostInput(input.value);
  if (result.errors) {
    errors.value = result.errors;
    nextTick(focusFirstError);
    return;
  }
  errors.value = {};

  pending.value = true;
  try {
    if (props.post) {
      await $fetch(`/api/posts/${props.post.id}`, {
        method: "PATCH",
        body: result.data,
      });
    } else {
      await $fetch("/api/posts", { method: "POST", body: result.data });
      draft.clear();
    }
    submitted.value = true;
    await navigateTo("/");
  } catch (e) {
    // Problems the server found in the fields come back as i18n keys, shown next to each field
    const fieldErrors = (
      e as { data?: { data?: { errors?: typeof errors.value } } }
    ).data?.data?.errors;
    if (fieldErrors) {
      errors.value = fieldErrors;
      nextTick(focusFirstError);
    } else {
      submitError.value = t("editor.saveFailed");
    }
  } finally {
    pending.value = false;
  }
}
</script>

<style lang="scss" src="./styles.scss"></style>

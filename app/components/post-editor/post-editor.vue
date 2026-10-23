<template>
  <form class="post-editor" novalidate @submit.prevent="submit">
    <!-- Left page: photos -->
    <section
      class="post-editor__photos"
      :class="{ 'post-editor__photos--dragging': draggingFiles }"
      aria-labelledby="post-photos-heading"
      @dragover.prevent="onPageDragOver"
      @dragleave="draggingFiles = false"
      @drop.prevent="onPageDrop"
    >
      <h2 id="post-photos-heading" class="post-editor__visually-hidden">Photos</h2>

      <div class="post-editor__cover">
        <img
          v-if="cover"
          :src="cover.preview"
          alt="Cover photo"
          class="post-editor__cover-image"
        />
        <button
          v-else
          id="post-images"
          class="post-editor__dropzone"
          type="button"
          :aria-invalid="!!errors.images || undefined"
          aria-describedby="post-images-error"
          @click="fileInput?.click()"
        >
          <svg class="post-editor__dropzone-icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="1" />
            <circle cx="12" cy="12" r="3.5" />
          </svg>
          <span class="post-editor__dropzone-title">Add photos of your dish</span>
          <span class="post-editor__dropzone-hint">Drag them here or choose files · up to {{ POST_LIMITS.photos }}</span>
        </button>
      </div>

      <ul class="post-editor__thumbs">
        <li
          v-for="(photo, index) in photos"
          :key="photo.id"
          class="post-editor__thumb"
          :class="{ 'post-editor__thumb--cover': index === 0, 'post-editor__thumb--error': photo.status === 'error' }"
          draggable="true"
          @dragstart="dragIndex = index"
          @dragover.prevent
          @drop.prevent.stop="onThumbDrop(index)"
        >
          <img :src="photo.preview" :alt="`Photo ${index + 1}`" class="post-editor__thumb-image" />
          <span v-if="index === 0" class="post-editor__badge">Cover</span>

          <span v-if="photo.status === 'uploading'" class="post-editor__thumb-status">Uploading…</span>
          <span v-else-if="photo.status === 'error'" class="post-editor__thumb-status">
            Failed
            <button class="post-editor__retry" type="button" @click="upload(photo)">Retry</button>
          </span>

          <div class="post-editor__thumb-actions">
            <button
              class="post-editor__thumb-action"
              type="button"
              :disabled="index === 0"
              :aria-label="`Move photo ${index + 1} left`"
              @click="movePhoto(index, -1)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
            </button>
            <button
              class="post-editor__thumb-action"
              type="button"
              :disabled="index === photos.length - 1"
              :aria-label="`Move photo ${index + 1} right`"
              @click="movePhoto(index, 1)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
            </button>
            <button
              class="post-editor__thumb-action"
              type="button"
              :aria-label="`Remove photo ${index + 1}`"
              @click="removePhoto(index)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
        </li>

        <li v-if="photos.length > 0 && photos.length < POST_LIMITS.photos" class="post-editor__thumb">
          <button class="post-editor__add-photo" type="button" @click="fileInput?.click()">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            <span class="post-editor__visually-hidden">Add photos</span>
          </button>
        </li>
      </ul>

      <p class="post-editor__photo-count">
        {{ photos.length }} of {{ POST_LIMITS.photos }} photos<template v-if="photos.length > 1"> · first is the cover, drag or use the arrows to reorder</template>
      </p>
      <p v-if="errors.images" id="post-images-error" class="post-editor__field-error">{{ errors.images }}</p>

      <input
        ref="fileInput"
        class="post-editor__visually-hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        tabindex="-1"
        aria-hidden="true"
        @change="onFilesChosen"
      />
    </section>

    <!-- Right page: the recipe, or a preview of the feed card -->
    <section class="post-editor__recipe" aria-label="Recipe">
      <div v-if="restoredDraft" class="post-editor__notice" role="status">
        Your unfinished draft was restored.
        <button class="post-editor__link" type="button" @click="discardDraft">Start over</button>
      </div>

      <template v-if="!showPreview">
        <div class="post-editor__field">
          <label class="post-editor__visually-hidden" for="post-title">Title</label>
          <input
            id="post-title"
            v-model="title"
            class="post-editor__title"
            type="text"
            placeholder="Recipe title"
            :maxlength="POST_LIMITS.title"
            :aria-invalid="!!errors.title || undefined"
            aria-describedby="post-title-error"
          />
          <p v-if="errors.title" id="post-title-error" class="post-editor__field-error">{{ errors.title }}</p>
        </div>

        <div class="post-editor__field">
          <label class="post-editor__visually-hidden" for="post-caption">Description</label>
          <textarea
            id="post-caption"
            ref="captionField"
            v-model="caption"
            class="post-editor__caption"
            rows="3"
            placeholder="Say anything you want about this recipe: a quick note, the story behind it, tips… (optional)"
            :maxlength="POST_LIMITS.caption"
            :aria-invalid="!!errors.caption || undefined"
            aria-describedby="post-caption-error"
            @input="fitCaption"
          />
          <p v-if="errors.caption" id="post-caption-error" class="post-editor__field-error">{{ errors.caption }}</p>
        </div>

        <div class="post-editor__details">
          <div class="post-editor__detail">
            <label class="post-editor__label" for="post-servings">Servings</label>
            <input
              id="post-servings"
              v-model="servings"
              class="post-editor__input"
              type="text"
              placeholder="e.g. 4 jars"
              :maxlength="POST_LIMITS.servings"
            />
          </div>
          <div class="post-editor__detail">
            <label class="post-editor__label" for="post-time">Total time</label>
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
              <span class="post-editor__suffix" aria-hidden="true">min</span>
            </div>
            <p v-if="errors.totalTimeMinutes" id="post-time-error" class="post-editor__field-error">
              {{ errors.totalTimeMinutes }}
            </p>
          </div>
        </div>

        <div class="post-editor__lists">
          <div class="post-editor__list">
            <h3 class="post-editor__label">Ingredients</h3>
            <list-editor
              v-model="ingredients"
              id-prefix="post-ingredients"
              item-label="Ingredient"
              add-label="Add ingredient"
              placeholder="500 g strawberries"
              :max="POST_LIMITS.ingredients"
              :invalid="!!errors.ingredients"
              describedby="post-ingredients-error"
            />
            <p v-if="errors.ingredients" id="post-ingredients-error" class="post-editor__field-error">
              {{ errors.ingredients }}
            </p>
          </div>

          <div class="post-editor__list">
            <h3 class="post-editor__label">Steps</h3>
            <list-editor
              v-model="steps"
              id-prefix="post-steps"
              item-label="Step"
              add-label="Add step"
              placeholder="Hull and halve the strawberries."
              :max="POST_LIMITS.steps"
              numbered
              multiline
              :invalid="!!errors.steps"
              describedby="post-steps-error"
            />
            <p v-if="errors.steps" id="post-steps-error" class="post-editor__field-error">{{ errors.steps }}</p>
          </div>
        </div>
      </template>

      <div v-else class="post-editor__preview">
        <h2 class="post-editor__label">How it will look in the feed</h2>
        <recipe-post v-bind="previewPost" preview />
      </div>

      <p v-if="submitError" class="post-editor__error" role="alert">{{ submitError }}</p>

      <div class="post-editor__footer">
        <span class="post-editor__status" aria-live="polite">{{ statusText }}</span>
        <div class="post-editor__buttons">
          <NuxtLink v-if="post" :to="'/'" class="post-editor__button">Discard changes</NuxtLink>
          <button class="post-editor__button" type="button" @click="showPreview = !showPreview">
            {{ showPreview ? "Back to editing" : "Preview" }}
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
    </section>
  </form>
</template>

<script setup lang="ts">
interface Photo {
  id: string;
  key: string;
  preview: string;
  status: "uploading" | "done" | "error";
  file?: File;
}

interface Draft extends Omit<PostInput, "totalTimeMinutes"> {
  totalTime: number | "";
  savedAt: string;
}

const DRAFT_STORAGE_KEY = "goodplates:draft";

const props = defineProps<{ post?: IPostContent }>();

const { user } = useUserSession();

const photos = ref<Photo[]>([]);
const title = ref("");
const caption = ref("");
const servings = ref("");
const totalTime = ref<number | "">("");
const ingredients = ref<string[]>([""]);
const steps = ref<string[]>([""]);

const errors = ref<Partial<Record<PostField, string>>>({});
const submitError = ref("");
const pending = ref(false);
const submitted = ref(false);
const showPreview = ref(false);
const dirty = ref(false);
const restoredDraft = ref(false);
const draftSavedAt = ref<Date | null>(null);

const fileInput = ref<HTMLInputElement>();
const captionField = ref<HTMLTextAreaElement>();

// The description grows with its text, short note or long story
function fitCaption() {
  const el = captionField.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight + 2}px`;
}
const draggingFiles = ref(false);
const dragIndex = ref<number | null>(null);

const cover = computed(() => photos.value[0]);
const uploading = computed(() => photos.value.some((photo) => photo.status === "uploading"));
const doneKeys = computed(() => photos.value.filter((photo) => photo.status === "done").map((photo) => photo.key));

const submitLabel = computed(() => {
  if (pending.value) return props.post ? "Saving…" : "Posting…";
  if (uploading.value) return "Uploading photos…";
  return props.post ? "Save changes" : "Post recipe";
});

const statusText = computed(() => {
  if (props.post || !draftSavedAt.value) return "";
  const time = draftSavedAt.value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `Draft saved in this browser · ${time}`;
});

const input = computed<PostInput>(() => ({
  title: title.value,
  caption: caption.value,
  images: doneKeys.value,
  ingredients: ingredients.value,
  steps: steps.value,
  servings: servings.value,
  totalTimeMinutes: totalTime.value === "" ? null : totalTime.value,
}));

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
  const lines = (list: string[]) => list.map((line) => line.trim()).filter(Boolean);

  return {
    ...input.value,
    id: props.post?.id ?? "preview",
    author,
    title: title.value.trim() || "Recipe title",
    ingredients: lines(ingredients.value),
    steps: lines(steps.value),
    likeCount: props.post?.likeCount ?? 0,
    likedByMe: false,
    createdAt: props.post?.createdAt ?? now,
    modifiedAt: now,
  };
});

// Fill the form from the post being edited, or from a saved draft
function load(source: Omit<PostInput, "totalTimeMinutes"> & { totalTime: number | "" }) {
  photos.value = source.images.map((key) => ({
    id: key,
    key,
    preview: imageSources(key).src,
    status: "done",
  }));
  title.value = source.title;
  caption.value = source.caption;
  servings.value = source.servings;
  totalTime.value = source.totalTime;
  ingredients.value = source.ingredients.length ? [...source.ingredients] : [""];
  steps.value = source.steps.length ? [...source.steps] : [""];
}

if (props.post) {
  load({ ...props.post, totalTime: props.post.totalTimeMinutes ?? "" });
}

function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function saveDraft() {
  if (props.post || submitted.value) return;
  const draft: Draft = { ...input.value, totalTime: totalTime.value, savedAt: new Date().toISOString() };
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    draftSavedAt.value = new Date(draft.savedAt);
  } catch {
    // Private windows can block storage; the form still works without drafts
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Nothing to clear
  }
  draftSavedAt.value = null;
}

function discardDraft() {
  clearDraft();
  restoredDraft.value = false;
  load({ title: "", caption: "", images: [], ingredients: [], steps: [], servings: "", totalTime: "" });
  nextTick(() => {
    dirty.value = false;
    fitCaption();
  });
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;

watch(
  [title, caption, servings, totalTime, ingredients, steps, doneKeys],
  () => {
    dirty.value = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 800);
  },
  { deep: true },
);

onMounted(() => {
  if (!props.post) {
    const draft = readDraft();
    if (draft) {
      load(draft);
      restoredDraft.value = true;
      draftSavedAt.value = new Date(draft.savedAt);
    }
  }
  nextTick(() => {
    dirty.value = false;
    fitCaption();
  });
  window.addEventListener("beforeunload", onBeforeUnload);
});

onBeforeUnmount(() => {
  clearTimeout(saveTimer);
  window.removeEventListener("beforeunload", onBeforeUnload);
  photos.value.forEach((photo) => photo.file && URL.revokeObjectURL(photo.preview));
});

// Drafts keep new posts safe; edits and running uploads are not saved anywhere yet
function hasUnsavedWork() {
  return !submitted.value && ((props.post && dirty.value) || uploading.value);
}

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (hasUnsavedWork()) {
    event.preventDefault();
  }
}

onBeforeRouteLeave(() => {
  if (hasUnsavedWork() && !window.confirm("Leave without saving your changes?")) {
    return false;
  }
});

// Photos

function addFiles(files: FileList | File[]) {
  const room = POST_LIMITS.photos - photos.value.length;
  const chosen = Array.from(files).filter((file) => file.type.startsWith("image/"));

  if (chosen.length > room) {
    errors.value = { ...errors.value, images: `Only ${POST_LIMITS.photos} photos fit; the rest were skipped` };
  } else {
    errors.value = { ...errors.value, images: undefined };
  }

  for (const file of chosen.slice(0, room)) {
    const photo = reactive<Photo>({
      id: crypto.randomUUID(),
      key: "",
      preview: URL.createObjectURL(file),
      status: "uploading",
      file,
    });
    photos.value.push(photo);
    upload(photo);
  }
}

async function upload(photo: Photo) {
  if (!photo.file) return;
  photo.status = "uploading";
  try {
    const form = new FormData();
    form.append("image", photo.file);
    const { key } = await $fetch("/api/uploads", { method: "POST", body: form });
    photo.key = key;
    photo.status = "done";
  } catch {
    photo.status = "error";
  }
}

function onFilesChosen(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files) addFiles(target.files);
  target.value = "";
}

function onPageDragOver(event: DragEvent) {
  draggingFiles.value = event.dataTransfer?.types.includes("Files") ?? false;
}

function onPageDrop(event: DragEvent) {
  draggingFiles.value = false;
  if (event.dataTransfer?.files.length) addFiles(event.dataTransfer.files);
}

function movePhoto(index: number, delta: number) {
  const target = index + delta;
  const next = [...photos.value];
  [next[index], next[target]] = [next[target]!, next[index]!];
  photos.value = next;
}

function onThumbDrop(index: number) {
  if (dragIndex.value === null || dragIndex.value === index) return;
  const next = [...photos.value];
  const [moved] = next.splice(dragIndex.value, 1);
  next.splice(index, 0, moved!);
  photos.value = next;
  dragIndex.value = null;
}

function removePhoto(index: number) {
  const [removed] = photos.value.splice(index, 1);
  if (removed?.file) URL.revokeObjectURL(removed.preview);
}

// Submit

const fieldOrder: PostField[] = ["images", "title", "caption", "totalTimeMinutes", "ingredients", "steps"];
const fieldTargets: Partial<Record<PostField, string>> = {
  images: "post-images",
  title: "post-title",
  caption: "post-caption",
  totalTimeMinutes: "post-time",
  ingredients: "post-ingredients-0",
  steps: "post-steps-0",
};

function focusFirstError() {
  const first = fieldOrder.find((field) => errors.value[field]);
  const target = first && document.getElementById(fieldTargets[first] ?? "");
  const fallback = first === "images" ? document.querySelector<HTMLElement>(".post-editor__photos") : null;
  (target ?? fallback)?.scrollIntoView({ behavior: "smooth", block: "center" });
  target?.focus({ preventScroll: true });
}

async function submit() {
  submitError.value = "";
  showPreview.value = false;

  if (photos.value.some((photo) => photo.status === "error")) {
    errors.value = { images: "A photo failed to upload. Retry it or remove it." };
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
      await $fetch(`/api/posts/${props.post.id}`, { method: "PATCH", body: result.data });
    } else {
      await $fetch("/api/posts", { method: "POST", body: result.data });
      clearDraft();
    }
    submitted.value = true;
    await navigateTo("/");
  } catch (e) {
    const { statusMessage } = e as { statusMessage?: string };
    submitError.value = statusMessage
      ? `${statusMessage}. Your recipe is still here; try again.`
      : "Could not save your recipe. It is still here; try again.";
  } finally {
    pending.value = false;
  }
}
</script>

<style lang="scss" src="./styles.scss"></style>

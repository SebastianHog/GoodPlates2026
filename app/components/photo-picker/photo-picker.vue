<template>
  <section
    class="photo-picker"
    :class="{ 'photo-picker--dragging': draggingFiles }"
    aria-labelledby="photo-picker-heading"
    @dragover.prevent="onDragOver"
    @dragleave="draggingFiles = false"
    @drop.prevent="onDrop"
  >
    <h2 id="photo-picker-heading" class="visually-hidden">{{ $t("photos.heading") }}</h2>

    <div class="photo-picker__cover">
      <img v-if="photos[0]" :src="photos[0].preview" :alt="$t('photos.coverAlt')" class="photo-picker__cover-image" />
      <button
        v-else
        :id="inputId"
        class="photo-picker__dropzone"
        type="button"
        :aria-invalid="!!error || undefined"
        :aria-describedby="`${inputId}-error`"
        @click="chooseFiles"
      >
        <app-icon name="photo" class="photo-picker__dropzone-icon" />
        <span class="photo-picker__dropzone-title">{{ $t("photos.add") }}</span>
        <span class="photo-picker__dropzone-hint">{{ $t("photos.addHint", { max: POST_LIMITS.photos }) }}</span>
      </button>
    </div>

    <ul class="photo-picker__thumbs">
      <li
        v-for="(photo, index) in photos"
        :key="photo.id"
        class="photo-picker__thumb"
        :class="{
          'photo-picker__thumb--cover': index === 0,
          'photo-picker__thumb--error': photo.status === 'error',
        }"
        draggable="true"
        @dragstart="dragIndex = index"
        @dragover.prevent
        @drop.prevent.stop="onThumbDrop(index)"
      >
        <img :src="photo.preview" :alt="$t('photos.thumbAlt', { index: index + 1 })" class="photo-picker__thumb-image" />
        <span v-if="index === 0" class="photo-picker__badge">{{ $t("photos.cover") }}</span>

        <span v-if="photo.status === 'uploading'" class="photo-picker__status">{{ $t("photos.uploading") }}</span>
        <span v-else-if="photo.status === 'error'" class="photo-picker__status">
          {{ $t("photos.failed") }}
          <button class="photo-picker__retry" type="button" @click="upload(photo)">{{ $t("photos.retry") }}</button>
        </span>

        <div class="photo-picker__actions">
          <button
            class="photo-picker__action"
            type="button"
            :disabled="index === 0"
            :aria-label="$t('photos.moveLeft', { index: index + 1 })"
            @click="move(index, -1)"
          >
            <app-icon name="chevron-left" />
          </button>
          <button
            class="photo-picker__action"
            type="button"
            :disabled="index === photos.length - 1"
            :aria-label="$t('photos.moveRight', { index: index + 1 })"
            @click="move(index, 1)"
          >
            <app-icon name="chevron-right" />
          </button>
          <button class="photo-picker__action" type="button" :aria-label="$t('photos.remove', { index: index + 1 })" @click="remove(index)">
            <app-icon name="close" />
          </button>
        </div>
      </li>

      <li v-if="photos.length > 0 && photos.length < POST_LIMITS.photos" class="photo-picker__thumb">
        <button class="photo-picker__add" type="button" @click="chooseFiles">
          <app-icon name="plus" />
          <span class="visually-hidden">{{ $t("photos.addMore") }}</span>
        </button>
      </li>
    </ul>

    <p class="photo-picker__count">
      {{ $t("photos.count", { count: photos.length, max: POST_LIMITS.photos }) }}
      <template v-if="photos.length > 1">· {{ $t("photos.reorderHint") }}</template>
    </p>
    <p v-if="error || notice" :id="`${inputId}-error`" class="photo-picker__error">{{ error || notice }}</p>

    <input
      ref="fileInput"
      class="visually-hidden"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/avif"
      multiple
      tabindex="-1"
      aria-hidden="true"
      @change="onFilesChosen"
    />
  </section>
</template>

<script setup lang="ts">
import type { EditorPhoto } from "~/utils/editorPhoto";

// Up to six photos for a post. Photos upload as soon as they are added; the first one is the cover.
defineProps<{
  // The id of the empty drop zone, so a form can focus it when photos are missing
  inputId: string;
  error?: string;
}>();

const photos = defineModel<EditorPhoto[]>({ required: true });

const { t } = useI18n();

const fileInput = ref<HTMLInputElement>();
const draggingFiles = ref(false);
const dragIndex = ref<number | null>(null);
const notice = ref("");

function chooseFiles() {
  fileInput.value?.click();
}

// Adding

function addFiles(files: FileList | File[]) {
  const room = POST_LIMITS.photos - photos.value.length;
  const chosen = Array.from(files).filter((file) => file.type.startsWith("image/"));

  notice.value = chosen.length > room ? t("photos.tooMany", { max: POST_LIMITS.photos }) : "";

  const added = chosen.slice(0, room).map((file) =>
    reactive<EditorPhoto>({
      id: crypto.randomUUID(),
      key: "",
      preview: URL.createObjectURL(file),
      status: "uploading",
      file,
    }),
  );

  photos.value = [...photos.value, ...added];
  added.forEach(upload);
}

async function upload(photo: EditorPhoto) {
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
  const input = event.target as HTMLInputElement;
  if (input.files) addFiles(input.files);
  input.value = "";
}

// Files dragged onto the page; reordering thumbnails is handled separately below
function onDragOver(event: DragEvent) {
  draggingFiles.value = event.dataTransfer?.types.includes("Files") ?? false;
}

function onDrop(event: DragEvent) {
  draggingFiles.value = false;
  if (event.dataTransfer?.files.length) addFiles(event.dataTransfer.files);
}

// Reordering and removing

function move(index: number, delta: number) {
  const next = [...photos.value];
  [next[index], next[index + delta]] = [next[index + delta]!, next[index]!];
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

function remove(index: number) {
  const removed = photos.value[index];
  if (removed?.file) URL.revokeObjectURL(removed.preview);
  photos.value = photos.value.filter((_, i) => i !== index);
}

onBeforeUnmount(() => {
  photos.value.forEach((photo) => photo.file && URL.revokeObjectURL(photo.preview));
});
</script>

<style lang="scss" src="./styles.scss"></style>

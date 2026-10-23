<template>
  <div class="photo-carousel">
    <div
      ref="track"
      class="photo-carousel__track"
      :role="hasSeveral ? 'region' : undefined"
      :aria-label="hasSeveral ? $t('post.photos', { title, count: images.length }) : undefined"
      :tabindex="hasSeveral ? 0 : undefined"
      @scroll.passive="onScroll"
    >
      <img
        v-for="(image, index) in images"
        :key="image"
        v-bind="imageSources(image)"
        :sizes="sizes"
        :alt="hasSeveral ? $t('post.photo', { title, index: index + 1, count: images.length }) : title"
        class="photo-carousel__image"
        loading="lazy"
        decoding="async"
      />
    </div>

    <div v-if="hasSeveral" class="photo-carousel__dots">
      <button
        v-for="(image, index) in images"
        :key="image"
        class="photo-carousel__dot"
        :class="{ 'photo-carousel__dot--active': index === activeIndex }"
        type="button"
        :aria-label="$t('post.showPhoto', { index: index + 1 })"
        :aria-current="index === activeIndex || undefined"
        @click="showPhoto(index)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Square photos that scroll sideways; the dots follow the scroll and jump to a photo
const props = defineProps<{
  images: string[];
  title: string;
  // How wide the carousel is drawn, so the browser loads the right image size
  sizes: string;
}>();

const hasSeveral = computed(() => props.images.length > 1);

const track = ref<HTMLElement>();
const activeIndex = ref(0);

function onScroll() {
  const el = track.value;
  if (el) activeIndex.value = Math.round(el.scrollLeft / el.clientWidth);
}

function showPhoto(index: number) {
  const el = track.value;
  el?.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
}
</script>

<style lang="scss" src="./styles.scss"></style>

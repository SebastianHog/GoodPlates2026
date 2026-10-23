<template>
  <!-- Our own SVG files, inlined so they take the text colour -->
  <span class="app-icon" aria-hidden="true" v-html="svg" />
</template>

<script lang="ts">
export type IconName =
  | "alert"
  | "bookmark"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "chevron-up"
  | "close"
  | "photo"
  | "plus"
  | "search"
  | "thumbs-up";
</script>

<script setup lang="ts">
// Every .svg in assets/icons, as raw markup, keyed by file name
const files = import.meta.glob<string>("~/assets/icons/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

const icons = Object.fromEntries(
  Object.entries(files).map(([path, svg]) => [
    path.split("/").pop()!.replace(".svg", ""),
    svg,
  ]),
);

const props = defineProps<{ name: IconName }>();

const svg = computed(() => icons[props.name] ?? "");
</script>

<style lang="scss" src="./styles.scss"></style>

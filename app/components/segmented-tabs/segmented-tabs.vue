<template>
  <div
    class="segmented-tabs"
    role="tablist"
    :aria-label="label"
    :style="{ '--tab-count': tabs.length, '--tab-index': activeIndex }"
  >
    <button
      v-for="(tab, index) in tabs"
      :id="`${idPrefix}-${tab.id}`"
      :key="tab.id"
      class="segmented-tabs__tab"
      type="button"
      role="tab"
      :aria-selected="tab.id === modelValue"
      :aria-controls="panelId"
      :tabindex="tab.id === modelValue ? 0 : -1"
      @click="select(tab.id)"
      @keydown="onKeydown($event, index)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup lang="ts" generic="T extends string">
// Tabs drawn as a two-or-more part switch; a white pill slides behind the selected one
const props = defineProps<{
  tabs: { id: T; label: string }[];
  modelValue: T;
  // The element the tabs control, and a prefix for each tab's id (the panel's aria-labelledby)
  panelId: string;
  idPrefix: string;
  label: string;
}>();

const emit = defineEmits<{ "update:modelValue": [value: T] }>();

const activeIndex = computed(() => props.tabs.findIndex((tab) => tab.id === props.modelValue));

function select(id: T) {
  if (id !== props.modelValue) emit("update:modelValue", id);
}

// Arrow keys move between tabs, as in the WAI-ARIA tabs pattern
function onKeydown(event: KeyboardEvent, index: number) {
  const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
  if (!step) return;

  const next = props.tabs[(index + step + props.tabs.length) % props.tabs.length]!;
  select(next.id);
  nextTick(() => document.getElementById(`${props.idPrefix}-${next.id}`)?.focus());
}
</script>

<style lang="scss" src="./styles.scss"></style>

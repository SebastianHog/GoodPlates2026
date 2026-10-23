<template>
  <div class="list-editor" :class="{ 'list-editor--numbered': numbered }">
    <ol class="list-editor__rows">
      <li v-for="(item, index) in modelValue" :key="index" class="list-editor__row">
        <span v-if="numbered" class="list-editor__number" aria-hidden="true">{{ index + 1 }}</span>
        <component
          :is="multiline ? 'textarea' : 'input'"
          :id="`${idPrefix}-${index}`"
          :ref="(el: unknown) => (fields[index] = el as HTMLInputElement)"
          class="list-editor__input"
          :value="item"
          :rows="multiline ? 1 : undefined"
          :maxlength="POST_LIMITS.line"
          :placeholder="index === 0 ? placeholder : ''"
          :aria-label="`${itemLabel} ${index + 1}`"
          :aria-invalid="invalid || undefined"
          :aria-describedby="describedby"
          @input="onInput($event, index)"
          @keydown="onKeydown($event, index)"
        />
        <div class="list-editor__actions">
          <button
            class="list-editor__action"
            type="button"
            :disabled="index === 0"
            :aria-label="$t('list.moveUp', { item: itemLabel.toLocaleLowerCase(), index: index + 1 })"
            @click="move(index, -1)"
          >
            <app-icon name="chevron-up" />
          </button>
          <button
            class="list-editor__action"
            type="button"
            :disabled="index === modelValue.length - 1"
            :aria-label="$t('list.moveDown', { item: itemLabel.toLocaleLowerCase(), index: index + 1 })"
            @click="move(index, 1)"
          >
            <app-icon name="chevron-down" />
          </button>
          <button
            class="list-editor__action"
            type="button"
            :disabled="modelValue.length === 1"
            :aria-label="$t('list.remove', { item: itemLabel.toLocaleLowerCase(), index: index + 1 })"
            @click="remove(index)"
          >
            <app-icon name="close" />
          </button>
        </div>
      </li>
    </ol>

    <button v-if="modelValue.length < max" class="list-editor__add" type="button" @click="insert(modelValue.length)">
      + {{ addLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string[];
  idPrefix: string;
  itemLabel: string;
  addLabel: string;
  max: number;
  placeholder?: string;
  numbered?: boolean;
  multiline?: boolean;
  invalid?: boolean;
  describedby?: string;
}>();

const emit = defineEmits<{ "update:modelValue": [value: string[]] }>();

const fields: HTMLInputElement[] = [];

// Textareas (steps) grow with their text
function fitHeight(el: HTMLElement | undefined) {
  if (props.multiline) fitToContent(el);
}

function onInput(event: Event, index: number) {
  const el = event.target as HTMLInputElement;
  update(index, el.value);
  fitHeight(el);
}

onMounted(() => fields.forEach(fitHeight));
watch(
  () => props.modelValue.length,
  () => nextTick(() => fields.forEach(fitHeight)),
);

function update(index: number, value: string) {
  const next = [...props.modelValue];
  next[index] = value;
  emit("update:modelValue", next);
}

function focusRow(index: number) {
  nextTick(() => fields[index]?.focus());
}

function insert(index: number) {
  if (props.modelValue.length >= props.max) return;
  const next = [...props.modelValue];
  next.splice(index, 0, "");
  emit("update:modelValue", next);
  focusRow(index);
}

function remove(index: number) {
  if (props.modelValue.length === 1) return;
  emit(
    "update:modelValue",
    props.modelValue.filter((_, i) => i !== index),
  );
  focusRow(Math.max(0, index - 1));
}

function move(index: number, delta: number) {
  const target = index + delta;
  const next = [...props.modelValue];
  [next[index], next[target]] = [next[target]!, next[index]!];
  emit("update:modelValue", next);
  focusRow(target);
}

// Enter adds a row below (Shift+Enter keeps a line break in steps); Backspace on an empty row removes it
function onKeydown(event: KeyboardEvent, index: number) {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    insert(index + 1);
  } else if (event.key === "Backspace" && props.modelValue[index] === "" && props.modelValue.length > 1) {
    event.preventDefault();
    remove(index);
  }
}
</script>

<style lang="scss" src="./styles.scss"></style>

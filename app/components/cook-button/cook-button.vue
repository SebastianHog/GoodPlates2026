<template>
  <div class="cook-button">
    <p v-if="allStepsDone && !cooked" class="cook-button__nudge">
      {{ $t("post.cooked.nudge") }}
    </p>

    <div class="cook-button__row">
      <button
        type="button"
        class="cook-button__button"
        :class="{ 'cook-button__button--done': cooked }"
        :aria-pressed="cooked"
        @click="toggle"
      >
        <app-icon
          v-if="cooked"
          name="check"
          class="cook-button__icon cook-button__icon--tick"
        />
        <app-icon v-else name="pot" class="cook-button__icon" />
        {{ $t("post.cooked.button") }}
      </button>

      <p class="cook-button__count" aria-live="polite">{{ countText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  postId: string;
  cookCount: number;
  cookedByMe: boolean;
  allStepsDone?: boolean;
}>();

const { t } = useI18n();

const {
  on: cooked,
  count: cooks,
  toggle,
} = usePostToggle(
  "cook",
  () => props.postId,
  () => ({ on: props.cookedByMe, count: props.cookCount }),
);

const countText = computed(() => {
  if (cooked.value) {
    const others = cooks.value - 1;
    return others > 0
      ? t("post.cooked.withOthers", { n: others }, others)
      : t("post.cooked.first");
  }
  return cooks.value > 0
    ? t("post.cooked.others", { n: cooks.value }, cooks.value)
    : t("post.cooked.none");
});
</script>

<style lang="scss" src="./styles.scss"></style>

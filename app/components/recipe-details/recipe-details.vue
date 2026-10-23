<template>
  <div class="recipe-details">
    <section
      v-if="ingredients.length"
      class="recipe-details__section recipe-details__section--ingredients"
    >
      <h2 class="recipe-details__heading">
        {{ $t("post.details.ingredients") }}
        <span v-if="servings" class="recipe-details__servings"
          >· {{ servings }}</span
        >
      </h2>
      <ul class="recipe-details__list">
        <li v-for="(ingredient, index) in ingredients" :key="index">
          <label
            class="recipe-details__item"
            :class="{
              'recipe-details__item--done': done.ingredients.includes(index),
            }"
          >
            <input
              type="checkbox"
              class="recipe-details__check"
              :checked="done.ingredients.includes(index)"
              @change="toggle('ingredients', index)"
            />
            <span class="recipe-details__box" aria-hidden="true">
              <app-icon name="check" class="recipe-details__tick" />
            </span>
            <span class="recipe-details__text">{{ ingredient }}</span>
          </label>
        </li>
      </ul>
    </section>

    <section
      v-if="steps.length"
      class="recipe-details__section recipe-details__section--steps"
    >
      <h2 class="recipe-details__heading">{{ $t("post.details.steps") }}</h2>
      <ol class="recipe-details__list">
        <li v-for="(step, index) in steps" :key="index">
          <label
            class="recipe-details__item"
            :class="{
              'recipe-details__item--done': done.steps.includes(index),
            }"
          >
            <input
              type="checkbox"
              class="recipe-details__check"
              :checked="done.steps.includes(index)"
              @change="toggle('steps', index)"
            />
            <span
              class="recipe-details__box recipe-details__box--numbered"
              aria-hidden="true"
            >
              <span class="recipe-details__number">{{ index + 1 }}</span>
              <app-icon name="check" class="recipe-details__tick" />
            </span>
            <span class="recipe-details__text">{{ step }}</span>
          </label>
        </li>
      </ol>

      <button
        v-if="anyDone"
        type="button"
        class="recipe-details__clear"
        @click="clear"
      >
        {{ $t("post.details.clear") }}
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
// Ticks are saved per tab, so a reload while cooking keeps them
const props =
  defineProps<
    Pick<IPostContent, "id" | "ingredients" | "steps" | "servings">
  >();

type Part = "ingredients" | "steps";

// complete recipe when all steps are ticked
const emit = defineEmits<{ complete: [value: boolean] }>();

const done = reactive<Record<Part, number[]>>({ ingredients: [], steps: [] });
const anyDone = computed(
  () => done.ingredients.length > 0 || done.steps.length > 0,
);
const storageKey = computed(() => `goodplates:ticks:${props.id}`);

watch(
  () => props.steps.length > 0 && done.steps.length === props.steps.length,
  (complete) => emit("complete", complete),
);

onMounted(() => {
  try {
    const saved = JSON.parse(
      sessionStorage.getItem(storageKey.value) ?? "null",
    );
    if (saved) Object.assign(done, saved);
  } catch {}
});

function save() {
  try {
    sessionStorage.setItem(storageKey.value, JSON.stringify(done));
  } catch {}
}

function toggle(part: Part, index: number) {
  const list = done[part];
  done[part] = list.includes(index)
    ? list.filter((i) => i !== index)
    : [...list, index];
  save();
}

function clear() {
  done.ingredients = [];
  done.steps = [];
  save();
}
</script>

<style lang="scss" src="./styles.scss"></style>

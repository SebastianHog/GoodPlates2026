<template>
  <div class="recipe-details">
    <section
      v-if="ingredients.length"
      ref="ingredientsSection"
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
      <span ref="stepsEnd" class="recipe-details__steps-end" aria-hidden="true" />

      <button
        v-if="anyDone"
        type="button"
        class="recipe-details__clear"
        @click="clear"
      >
        {{ $t("post.details.clear") }}
      </button>
    </section>

    <!-- Phones only: while cooking through the steps, the ingredients are a tap away at the bottom -->
    <template v-if="ingredients.length && steps.length">
      <Transition name="recipe-details__peek">
        <button
          v-show="peekVisible"
          type="button"
          class="recipe-details__peek"
          aria-haspopup="dialog"
          @click="openSheet"
        >
          <span class="recipe-details__peek-label">{{
            $t("post.details.ingredients")
          }}</span>
          <span class="recipe-details__peek-count">{{ peekCount }}</span>
          <app-icon name="chevron-up" class="recipe-details__peek-icon" />
        </button>
      </Transition>

      <dialog
        ref="sheet"
        class="recipe-details__sheet"
        :aria-labelledby="sheetTitleId"
        @click="closeOnBackdrop"
      >
        <div class="recipe-details__sheet-panel">
          <header class="recipe-details__sheet-header">
            <h2 :id="sheetTitleId" class="recipe-details__heading">
              {{ $t("post.details.ingredients") }}
              <span v-if="servings" class="recipe-details__servings"
                >· {{ servings }}</span
              >
            </h2>
            <button
              type="button"
              class="recipe-details__sheet-close"
              :aria-label="$t('post.details.closeIngredients')"
              @click="closeSheet"
            >
              <app-icon name="close" />
            </button>
          </header>

          <ul class="recipe-details__list">
            <li v-for="(ingredient, index) in ingredients" :key="index">
              <label
                class="recipe-details__item"
                :class="{
                  'recipe-details__item--done':
                    done.ingredients.includes(index),
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
        </div>
      </dialog>
    </template>
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

const { t } = useI18n();

const done = reactive<Record<Part, number[]>>({ ingredients: [], steps: [] });
const anyDone = computed(
  () => done.ingredients.length > 0 || done.steps.length > 0,
);
const storageKey = computed(() => `goodplates:ticks:${props.id}`);

watch(
  () => props.steps.length > 0 && done.steps.length === props.steps.length,
  (complete) => emit("complete", complete),
);

// The bar shows once the ingredient list has scrolled off the top, and hides again
// when the last step comes into view (so it never sits over the "I cooked this" button)
const ingredientsSection = ref<HTMLElement>();
const stepsEnd = ref<HTMLElement>();
const sheet = ref<HTMLDialogElement>();
const sheetTitleId = useId();

const ingredientsAbove = ref(false);
const stepsEndBelow = ref(false);
const peekVisible = computed(
  () => ingredientsAbove.value && stepsEndBelow.value,
);

const peekCount = computed(() => {
  const total = props.ingredients.length;
  return done.ingredients.length
    ? t("post.details.ticked", { done: done.ingredients.length, total })
    : t("post.summary.ingredients", total);
});

let observer: IntersectionObserver | undefined;

onMounted(() => {
  if (ingredientsSection.value && stepsEnd.value) {
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === ingredientsSection.value) {
          ingredientsAbove.value =
            !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;
        } else {
          stepsEndBelow.value =
            !entry.isIntersecting && entry.boundingClientRect.top > 0;
        }
      }
    });
    observer.observe(ingredientsSection.value);
    observer.observe(stepsEnd.value);
  }

  try {
    const saved = JSON.parse(
      sessionStorage.getItem(storageKey.value) ?? "null",
    );
    if (saved) Object.assign(done, saved);
  } catch {}
});

onBeforeUnmount(() => observer?.disconnect());

function openSheet() {
  sheet.value?.showModal();
}

function closeSheet() {
  sheet.value?.close();
}

// The panel fills the dialog, so a click that lands on the dialog itself is on the dimmed backdrop
function closeOnBackdrop(event: MouseEvent) {
  if (event.target === sheet.value) closeSheet();
}

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

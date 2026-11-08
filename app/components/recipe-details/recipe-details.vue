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
          >· {{ servingsLabel }}</span
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
      <!-- One line that never changes height: first how ticking works, then progress and Clear,
           so the list doesn't jump under the finger on the first tick and Clear sits far from the last step -->
      <p class="recipe-details__status" aria-live="polite">
        <template v-if="anyDone">
          {{ $t("post.details.progress", { done: doneStepCount, total: stepRows.length }) }}
          <button type="button" class="recipe-details__clear" @click="clear">
            {{ $t("post.details.clear") }}
          </button>
        </template>
        <template v-else>{{ $t("post.details.hint") }}</template>
      </p>

      <p v-for="(note, n) in leadNotes" :key="`lead-${n}`" class="recipe-details__note recipe-details__note--lead">
        {{ note }}
      </p>
      <ol class="recipe-details__list">
        <li
          v-for="row in stepRows"
          :key="row.index"
          class="recipe-details__step"
          :class="{ 'recipe-details__step--current': row.index === currentStep }"
          :aria-current="row.index === currentStep ? 'step' : undefined"
        >
          <label
            class="recipe-details__item"
            :class="{
              'recipe-details__item--done': done.steps.includes(row.index),
            }"
          >
            <input
              type="checkbox"
              class="recipe-details__check"
              :checked="done.steps.includes(row.index)"
              @change="toggle('steps', row.index)"
            />
            <span
              class="recipe-details__box recipe-details__box--numbered"
              aria-hidden="true"
            >
              <span class="recipe-details__number">{{ row.number }}</span>
              <app-icon name="check" class="recipe-details__tick" />
            </span>
            <span class="recipe-details__text">{{ row.text }}</span>
          </label>
          <!-- "Note:" and "Tip:" paragraphs belong to the step above: no checkbox, not needed to finish -->
          <p v-for="(note, n) in row.notes" :key="n" class="recipe-details__note">{{ note }}</p>
        </li>
      </ol>
      <span ref="stepsEnd" class="recipe-details__steps-end" aria-hidden="true" />
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
                >· {{ servingsLabel }}</span
              >
            </h2>
            <button
              type="button"
              class="recipe-details__sheet-close"
              :aria-label="$t('post.details.closeIngredients')"
              autofocus
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
// Ticks are kept on this device for 12 hours, so a reload, a new tab or the share link mid-cook keeps them
const props =
  defineProps<
    Pick<IPostContent, "id" | "ingredients" | "steps" | "servings">
  >();

type Part = "ingredients" | "steps";

// complete recipe when all steps are ticked
const emit = defineEmits<{ complete: [value: boolean] }>();

const { t } = useI18n();

// Servings is free text: "2 portions" shows as written, a bare "4" reads as "Serves 4"
const servingsLabel = computed(() => {
  const text = props.servings.trim();
  return /^\d+$/.test(text) ? t("post.details.serves", Number(text)) : text;
});

const { show: showToast } = useToast();

const done = reactive<Record<Part, number[]>>({ ingredients: [], steps: [] });
const anyDone = computed(
  () => done.ingredients.length > 0 || done.steps.length > 0,
);
const storageKey = computed(() => `goodplates:ticks:${props.id}`);
const TICKS_TTL_MS = 12 * 60 * 60 * 1000;

// Steps the cook ticks, numbered 1, 2, 3…; "Note:"/"Tip:" paragraphs hang off the step before them

const stepGroups = computed(() => {
  const rows: { index: number; number: number; text: string; notes: string[] }[] = [];
  const leadNotes: string[] = [];
  props.steps.forEach((text, index) => {
    if (isStepNote(text)) {
      (rows.at(-1)?.notes ?? leadNotes).push(text);
    } else {
      rows.push({ index, number: rows.length + 1, text, notes: [] });
    }
  });
  return { rows, leadNotes };
});
const stepRows = computed(() => stepGroups.value.rows);
const leadNotes = computed(() => stepGroups.value.leadNotes);

const doneStepCount = computed(
  () => stepRows.value.filter((row) => done.steps.includes(row.index)).length,
);

// Once cooking has started, the first step not yet ticked is "you are here"
const currentStep = computed(() =>
  anyDone.value
    ? stepRows.value.find((row) => !done.steps.includes(row.index))?.index
    : undefined,
);

watch(
  () => stepRows.value.length > 0 && doneStepCount.value === stepRows.value.length,
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
    const saved = JSON.parse(localStorage.getItem(storageKey.value) ?? "null");
    if (saved && Date.now() - saved.savedAt < TICKS_TTL_MS) {
      done.ingredients = saved.ingredients ?? [];
      done.steps = saved.steps ?? [];
    } else if (saved) {
      localStorage.removeItem(storageKey.value);
    }
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
    if (anyDone.value) {
      localStorage.setItem(storageKey.value, JSON.stringify({ ...done, savedAt: Date.now() }));
    } else {
      localStorage.removeItem(storageKey.value);
    }
  } catch {}
}

function toggle(part: Part, index: number) {
  const list = done[part];
  done[part] = list.includes(index)
    ? list.filter((i) => i !== index)
    : [...list, index];
  save();
}

// Clearing is one tap, so it can be undone from the toast
function clear() {
  const before = { ingredients: [...done.ingredients], steps: [...done.steps] };
  done.ingredients = [];
  done.steps = [];
  save();
  showToast(t("post.details.cleared"), {
    tone: "info",
    action: {
      label: t("post.details.undo"),
      onClick: () => {
        done.ingredients = before.ingredients;
        done.steps = before.steps;
        save();
      },
    },
  });
}
</script>

<style lang="scss" src="./styles.scss"></style>

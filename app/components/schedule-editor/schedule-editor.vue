<template>
  <form class="schedule-editor" novalidate @submit.prevent="submit">
    <div class="schedule-editor__field">
      <label for="schedule-name" class="visually-hidden">{{ $t("schedules.editor.name") }}</label>
      <input
        id="schedule-name"
        v-model="name"
        class="schedule-editor__name"
        type="text"
        :maxlength="SCHEDULE_LIMITS.name"
        :placeholder="$t('schedules.editor.namePlaceholder')"
        :aria-invalid="!!errors.name || undefined"
        aria-describedby="schedule-name-error"
      />
      <p v-if="errors.name" id="schedule-name-error" class="schedule-editor__field-error">
        {{ $t(errors.name, SCHEDULE_LIMITS) }}
      </p>
    </div>

    <div class="schedule-editor__field">
      <label for="schedule-description" class="schedule-editor__label">{{ $t("schedules.editor.description") }}</label>
      <textarea
        id="schedule-description"
        v-model="description"
        class="schedule-editor__description"
        rows="3"
        :maxlength="SCHEDULE_LIMITS.description"
        :placeholder="$t('schedules.editor.descriptionPlaceholder')"
        :aria-invalid="!!errors.description || undefined"
      />
      <p v-if="errors.description" class="schedule-editor__field-error">
        {{ $t(errors.description, SCHEDULE_LIMITS) }}
      </p>
    </div>

    <fieldset class="schedule-editor__visibility">
      <legend class="schedule-editor__label">{{ $t("schedules.editor.visibility") }}</legend>
      <label v-for="option in visibilityOptions" :key="String(option.value)" class="schedule-editor__option">
        <input v-model="isPublic" type="radio" name="visibility" :value="option.value" class="schedule-editor__radio" />
        <span>
          <span class="schedule-editor__option-label">{{ option.label }}</span>
          <span class="schedule-editor__option-hint">{{ option.hint }}</span>
        </span>
      </label>
    </fieldset>

    <section class="schedule-editor__days" aria-labelledby="schedule-days-heading">
      <h2 id="schedule-days-heading" class="schedule-editor__heading">{{ $t("schedules.editor.days") }}</h2>

      <section v-for="(day, dayIndex) in days" :key="dayKeys[dayIndex]" class="schedule-editor__day">
        <div class="schedule-editor__day-header">
          <h3 class="schedule-editor__day-title">{{ $t("schedules.day", { n: dayIndex + 1 }) }}</h3>
          <button
            v-if="days.length > 1"
            class="schedule-editor__icon"
            type="button"
            :aria-label="$t('schedules.editor.removeDay', { n: dayIndex + 1 })"
            @click="removeDay(dayIndex)"
          >
            <app-icon name="close" />
          </button>
        </div>

        <div v-for="meal in MEALS" :key="meal" class="schedule-editor__meal">
          <p class="schedule-editor__meal-title">{{ $t(`schedules.meals.${meal}`) }}</p>

          <ul v-if="day[meal].length" class="schedule-editor__recipes">
            <li v-for="(postId, index) in day[meal]" :key="postId">
              <schedule-recipe :post="posts[postId] ?? null">
                <template #actions>
                  <button
                    class="schedule-editor__icon"
                    type="button"
                    :disabled="index === 0"
                    :aria-label="$t('schedules.editor.moveUp', { title: recipeName(postId) })"
                    @click="move(day[meal], index, -1)"
                  >
                    <app-icon name="chevron-up" />
                  </button>
                  <button
                    class="schedule-editor__icon"
                    type="button"
                    :disabled="index === day[meal].length - 1"
                    :aria-label="$t('schedules.editor.moveDown', { title: recipeName(postId) })"
                    @click="move(day[meal], index, 1)"
                  >
                    <app-icon name="chevron-down" />
                  </button>
                  <button
                    class="schedule-editor__icon"
                    type="button"
                    :aria-label="$t('schedules.editor.remove', { title: recipeName(postId) })"
                    @click="day[meal].splice(index, 1)"
                  >
                    <app-icon name="close" />
                  </button>
                </template>
              </schedule-recipe>
            </li>
          </ul>

          <button
            v-if="day[meal].length < SCHEDULE_LIMITS.recipesPerMeal"
            class="schedule-editor__add"
            type="button"
            :aria-expanded="isPicking(dayIndex, meal)"
            :aria-label="$t('schedules.editor.addRecipeTo', { meal: $t(`schedules.meals.${meal}`), n: dayIndex + 1 })"
            @click="togglePicker(dayIndex, meal)"
          >
            + {{ $t("schedules.editor.addRecipe") }}
          </button>

          <recipe-picker
            v-if="isPicking(dayIndex, meal)"
            :label="$t('schedules.editor.addRecipeTo', { meal: $t(`schedules.meals.${meal}`), n: dayIndex + 1 })"
            :selected="day[meal]"
            :full="day[meal].length >= SCHEDULE_LIMITS.recipesPerMeal"
            @pick="pick(day[meal], $event)"
            @close="picking = null"
          />
        </div>
      </section>

      <button v-if="days.length < SCHEDULE_LIMITS.days" class="schedule-editor__add-day" type="button" @click="addDay">
        + {{ $t("schedules.editor.addDay") }}
      </button>
      <p v-if="errors.days" class="schedule-editor__field-error">{{ $t(errors.days, SCHEDULE_LIMITS) }}</p>
    </section>

    <p v-if="submitError" class="schedule-editor__error" role="alert">{{ submitError }}</p>

    <div class="schedule-editor__footer">
      <NuxtLink :to="schedule ? `/schedules/${schedule.id}` : '/schedules'" class="schedule-editor__button">
        {{ $t("schedules.editor.cancel") }}
      </NuxtLink>
      <button class="schedule-editor__button schedule-editor__button--primary" type="submit" :disabled="pending">
        {{ submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
// Creates a schedule, or edits `schedule`: name, description, who can see it, and up to 7 days of meals
const props = defineProps<{ schedule?: ISchedule }>();

const { t } = useI18n();

const name = ref(props.schedule?.name ?? "");
const description = ref(props.schedule?.description ?? "");
const isPublic = ref(props.schedule?.isPublic ?? false);
const days = ref<ScheduleDay[]>(
  props.schedule?.days.map((day) => ({ breakfast: [...day.breakfast], lunch: [...day.lunch], dinner: [...day.dinner] })) ?? [
    emptyDay(),
  ],
);
// Keys that stay with a day when an earlier one is removed
let nextKey = 0;
const dayKeys = ref(days.value.map(() => nextKey++));

// Recipes to show by id: the schedule's own, plus every one picked from bookmarks
const posts = ref<Record<string, IPostContent>>({ ...props.schedule?.posts });

const errors = ref<Partial<Record<ScheduleField, string>>>({});
const submitError = ref("");
const pending = ref(false);
const saved = ref(false);
const dirty = ref(false);

watch([name, description, isPublic, days], () => (dirty.value = true), { deep: true });

// A field's problem goes away as soon as it's changed
watch(name, () => (errors.value.name = undefined));
watch(description, () => (errors.value.description = undefined));
watch(days, () => (errors.value.days = undefined), { deep: true });

const visibilityOptions = computed(() => [
  { value: false, label: t("schedules.editor.private"), hint: t("schedules.editor.privateHint") },
  { value: true, label: t("schedules.editor.public"), hint: t("schedules.editor.publicHint") },
]);

const submitLabel = computed(() => {
  if (props.schedule) return t(pending.value ? "schedules.editor.saving" : "schedules.editor.save");
  return t(pending.value ? "schedules.editor.creating" : "schedules.editor.create");
});

function recipeName(postId: string) {
  return posts.value[postId]?.title ?? t("schedules.recipeRemoved");
}

// Days

function addDay() {
  days.value.push(emptyDay());
  dayKeys.value.push(nextKey++);
}

function removeDay(index: number) {
  const day = days.value[index]!;
  const hasRecipes = MEALS.some((meal) => day[meal].length);
  if (hasRecipes && !window.confirm(t("schedules.editor.removeDayConfirm", { n: index + 1 }))) return;
  days.value.splice(index, 1);
  dayKeys.value.splice(index, 1);
  picking.value = null;
}

function move(list: string[], index: number, by: number) {
  const [item] = list.splice(index, 1);
  list.splice(index + by, 0, item!);
}

// Picking from bookmarks: one meal at a time

const picking = ref<{ day: number; meal: Meal } | null>(null);

function isPicking(day: number, meal: Meal) {
  return picking.value?.day === day && picking.value.meal === meal;
}

function togglePicker(day: number, meal: Meal) {
  picking.value = isPicking(day, meal) ? null : { day, meal };
}

function pick(list: string[], post: IPostContent) {
  posts.value[post.id] = post;
  if (!list.includes(post.id)) list.push(post.id);
  if (list.length >= SCHEDULE_LIMITS.recipesPerMeal) picking.value = null;
}

// Leaving with unsaved changes

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value && !saved.value) event.preventDefault();
}
onMounted(() => window.addEventListener("beforeunload", onBeforeUnload));
onBeforeUnmount(() => window.removeEventListener("beforeunload", onBeforeUnload));

// Saving

async function submit() {
  submitError.value = "";
  const result = validateScheduleInput({
    name: name.value,
    description: description.value,
    isPublic: isPublic.value,
    days: days.value,
  });
  if (result.errors) {
    errors.value = result.errors;
    nextTick(() => document.querySelector<HTMLElement>(".schedule-editor [aria-invalid='true']")?.focus());
    return;
  }
  errors.value = {};

  pending.value = true;
  try {
    const { id } = props.schedule
      ? await $fetch<{ id: string }>(`/api/schedules/${props.schedule.id}`, { method: "PATCH", body: result.data })
      : await $fetch<{ id: string }>("/api/schedules", { method: "POST", body: result.data });
    saved.value = true;
    await navigateTo(`/schedules/${id}`);
  } catch (e) {
    const data = (e as { data?: { data?: { errors?: typeof errors.value; messageKey?: string } } }).data?.data;
    if (data?.errors) errors.value = data.errors;
    else submitError.value = t(data?.messageKey ?? "schedules.editor.saveFailed", { perUser: SCHEDULE_LIMITS.perUser });
  } finally {
    pending.value = false;
  }
}
</script>

<style lang="scss" src="./styles.scss"></style>

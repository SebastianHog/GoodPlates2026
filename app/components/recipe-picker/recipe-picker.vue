<template>
  <div class="recipe-picker" role="group" :aria-label="label">
    <div class="recipe-picker__header">
      <p class="recipe-picker__title">{{ $t("schedules.picker.title") }}</p>
      <button ref="closeButton" class="recipe-picker__close" type="button" :aria-label="$t('schedules.picker.close')" @click="emit('close')">
        <app-icon name="close" />
      </button>
    </div>

    <p v-if="status === 'pending'" class="recipe-picker__status" role="status">{{ $t("schedules.picker.loading") }}</p>

    <p v-else-if="error" class="recipe-picker__status" role="alert">
      {{ $t("schedules.picker.loadFailed") }}
      <button class="recipe-picker__inline" type="button" @click="refresh()">{{ $t("feed.retry") }}</button>
    </p>

    <p v-else-if="!bookmarks?.length" class="recipe-picker__status">
      {{ $t("schedules.picker.empty") }}
      <NuxtLink to="/" class="recipe-picker__inline">{{ $t("schedules.picker.browse") }}</NuxtLink>
    </p>

    <template v-else>
      <input
        v-if="bookmarks.length > 6"
        v-model="query"
        class="recipe-picker__filter"
        type="search"
        :placeholder="$t('schedules.picker.filter')"
        :aria-label="$t('schedules.picker.filter')"
      />
      <ul class="recipe-picker__list">
        <li v-for="post in matches" :key="post.id" class="recipe-picker__row">
          <schedule-recipe :post="post" :link="false">
            <template #actions>
              <button
                class="recipe-picker__add"
                type="button"
                :disabled="selected.includes(post.id) || full"
                @click="emit('pick', post)"
              >
                {{ selected.includes(post.id) ? $t("schedules.picker.added") : $t("schedules.picker.add") }}
              </button>
            </template>
          </schedule-recipe>
        </li>
      </ul>
      <p v-if="!matches.length" class="recipe-picker__status">
        {{ $t("schedules.picker.noMatches", { query }) }}
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
// The user's bookmarks to pick from; only bookmarked recipes can go in a schedule
const props = defineProps<{
  label: string;
  // Already in this meal
  selected: string[];
  full: boolean;
}>();

const emit = defineEmits<{ pick: [post: IPostContent]; close: [] }>();

const { data: bookmarks, status, error, refresh } = useFetch<IPostContent[]>("/api/bookmarks", {
  key: "schedule-picker-bookmarks",
  lazy: true,
  server: false,
});

const query = ref("");
const matches = computed(() => {
  const term = query.value.trim().toLocaleLowerCase();
  const list = bookmarks.value ?? [];
  return term
    ? list.filter((post) => `${post.title} ${post.author.displayName}`.toLocaleLowerCase().includes(term))
    : list;
});

const closeButton = ref<HTMLButtonElement>();
onMounted(() => closeButton.value?.focus());

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") emit("close");
}
onMounted(() => document.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));
</script>

<style lang="scss" src="./styles.scss"></style>

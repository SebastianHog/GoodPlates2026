<template>
  <section class="shopping-list" aria-labelledby="shopping-list-heading">
    <div class="shopping-list__header">
      <h2 id="shopping-list-heading" class="shopping-list__heading">{{ $t("schedules.shopping.title") }}</h2>
      <span v-if="total" class="shopping-list__count">{{ $t("schedules.shopping.count", { done: doneCount, total }) }}</span>
    </div>

    <p v-if="!groups.length" class="shopping-list__empty">{{ $t("schedules.shopping.empty") }}</p>

    <div v-for="group in groups" :key="group.post.id" class="shopping-list__group">
      <h3 class="shopping-list__recipe">{{ group.post.title }}</h3>
      <p v-if="!group.items.length" class="shopping-list__note">
        {{ group.duplicatesOnly ? $t("schedules.shopping.allListed") : $t("schedules.shopping.noIngredients") }}
      </p>
      <ul v-else class="shopping-list__items">
        <li v-for="item in group.items" :key="item.key">
          <label class="shopping-list__item" :class="{ 'shopping-list__item--done': ticked.has(item.key) }">
            <input
              type="checkbox"
              class="shopping-list__check"
              :checked="ticked.has(item.key)"
              @change="toggle(item.key)"
            />
            <span class="shopping-list__box" aria-hidden="true">
              <app-icon name="check" class="shopping-list__tick" />
            </span>
            <span class="shopping-list__text">
              {{ item.text }}
              <span v-if="item.alsoFor.length" class="shopping-list__also">
                · {{ $t("schedules.shopping.alsoFor", { title: item.alsoFor.join(", ") }) }}
              </span>
            </span>
          </label>
        </li>
      </ul>
    </div>

    <button v-if="doneCount" class="shopping-list__clear" type="button" @click="clear">
      {{ $t("schedules.shopping.clear") }}
    </button>
  </section>
</template>

<script setup lang="ts">
// Every ingredient of the schedule, grouped by recipe, to tick off while shopping.
// A line written exactly the same in several recipes is listed once, under the first. Ticks are kept in this browser
const props = defineProps<{
  scheduleId: string;
  days: ScheduleDay[];
  posts: Record<string, IPostContent>;
}>();

interface Item {
  key: string;
  text: string;
  alsoFor: string[];
}

const groups = computed(() => {
  const seen = new Map<string, Item>();
  return schedulePostIds(props.days)
    .map((id) => props.posts[id])
    .filter((post): post is IPostContent => Boolean(post))
    .map((post) => {
      const items: Item[] = [];
      for (const line of post.ingredients) {
        const key = line.trim().replace(/\s+/g, " ").toLocaleLowerCase();
        const first = seen.get(key);
        if (first) {
          if (!first.alsoFor.includes(post.title)) first.alsoFor.push(post.title);
          continue;
        }
        const item = { key, text: line, alsoFor: [] };
        seen.set(key, item);
        items.push(item);
      }
      return { post, items, duplicatesOnly: post.ingredients.length > 0 };
    });
});

const total = computed(() => groups.value.reduce((sum, group) => sum + group.items.length, 0));

// Ticks

const storageKey = computed(() => `goodplates:shopping:${props.scheduleId}`);
const ticked = ref(new Set<string>());

onMounted(() => {
  try {
    ticked.value = new Set(JSON.parse(localStorage.getItem(storageKey.value) ?? "[]"));
  } catch {
    // Nothing saved, or storage is blocked
  }
});

const doneCount = computed(() =>
  groups.value.reduce((sum, group) => sum + group.items.filter((item) => ticked.value.has(item.key)).length, 0),
);

function persist() {
  try {
    localStorage.setItem(storageKey.value, JSON.stringify([...ticked.value]));
  } catch {
    // Private windows can block storage; ticks then last until the page is left
  }
}

function toggle(key: string) {
  const next = new Set(ticked.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  ticked.value = next;
  persist();
}

function clear() {
  ticked.value = new Set();
  persist();
}
</script>

<style lang="scss" src="./styles.scss"></style>

<template>
  <article class="schedule-card">
    <div class="schedule-card__mosaic" :class="`schedule-card__mosaic--${coverImages.length}`" aria-hidden="true">
      <photo-placeholder v-if="!coverImages.length" />
      <img
        v-for="image in coverImages"
        v-else
        :key="image"
        v-bind="imageSources(image)"
        sizes="5rem"
        alt=""
        loading="lazy"
        decoding="async"
      />
    </div>

    <div class="schedule-card__info">
      <h3 class="schedule-card__name">
        <NuxtLink :to="`/schedules/${id}`" class="schedule-card__link">{{ name }}</NuxtLink>
      </h3>
      <p class="schedule-card__meta">
        <span v-if="!hideOwner">{{ $t("schedules.card.by", { name: authorName(owner) }) }} · </span>
        {{ $t("schedules.card.days", dayCount) }} · {{ $t("schedules.card.recipes", recipeCount) }}
      </p>
      <p v-if="showStatus && (!isPublic || savedFrom)" class="schedule-card__tags">
        <span v-if="!isPublic" class="schedule-card__tag">{{ $t("schedules.card.private") }}</span>
        <span v-if="savedFrom" class="schedule-card__tag">{{ $t("schedules.card.saved") }}</span>
      </p>
      <p v-if="description" class="schedule-card__description">{{ description }}</p>
    </div>
  </article>
</template>

<script setup lang="ts">
// A schedule in a list: the first recipes' photos, the name, and how big it is.
// `showStatus` adds Private / Saved copy labels (for your own list); `hideOwner` drops the author (on their profile)
defineProps<IScheduleSummary & { showStatus?: boolean; hideOwner?: boolean }>();

const authorName = useAuthorName();
</script>

<style lang="scss" src="./styles.scss"></style>

<template>
  <div v-if="hasMore" class="show-more">
    <button type="button" class="show-more__button" :disabled="loading" @click="emit('more')">
      {{ $t(loading ? "feed.loadingMore" : "feed.showMore") }}
    </button>
  </div>
</template>

<script setup lang="ts">
// "Show more recipes" under a list that has another page
defineProps<{ hasMore: boolean; loading: boolean }>();
const emit = defineEmits<{ more: [] }>();
</script>

<style lang="scss" src="./styles.scss"></style>

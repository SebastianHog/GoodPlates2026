<template>
  <template v-if="status === 'pending'">
    <p class="visually-hidden" role="status">{{ loadingLabel }}</p>
    <post-container aria-hidden="true">
      <recipe-post-skeleton v-for="n in skeletons" :key="n" />
    </post-container>
  </template>

  <status-message v-else-if="error?.statusCode === 404 && $slots.notFound">
    <slot name="notFound" />
  </status-message>

  <status-message v-else-if="error" role="alert">
    {{ failedLabel }}
    <button type="button" @click="emit('retry')">{{ $t("feed.retry") }}</button>
  </status-message>

  <slot v-else />
</template>

<script setup lang="ts">
// Loading, not found and failed states around something fetched with useFetch; shows the default slot once it's loaded
const { skeletons = 3 } = defineProps<{
  status: string;
  error?: { statusCode?: number } | null;
  loadingLabel: string;
  failedLabel: string;
  skeletons?: number;
}>();

const emit = defineEmits<{ retry: [] }>();
</script>

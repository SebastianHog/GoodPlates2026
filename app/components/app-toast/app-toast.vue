<template>
  <div class="app-toast" role="status" aria-live="polite">
    <Transition name="app-toast">
      <div
        v-if="toast"
        :key="toast.id"
        class="app-toast__box"
        :class="`app-toast__box--${toast.tone}`"
        @mouseenter="pause"
        @mouseleave="resume"
        @focusin="pause"
        @focusout="resume"
      >
        <app-icon
          v-if="toast.tone === 'error'"
          name="alert"
          class="app-toast__icon"
        />
        <p class="app-toast__message">{{ toast.message }}</p>
        <NuxtLink
          v-if="toast.action"
          :to="toast.action.to"
          class="app-toast__action"
          @click="dismiss"
        >
          {{ toast.action.label }}
        </NuxtLink>
        <button
          type="button"
          class="app-toast__close"
          :aria-label="$t('toast.dismiss')"
          @click="dismiss"
        >
          <app-icon name="close" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const { duration = 5000 } = defineProps<{ duration?: number }>();

const { toast, dismiss } = useToast();

let timer: ReturnType<typeof setTimeout> | undefined;

function pause() {
  clearTimeout(timer);
}

function resume() {
  clearTimeout(timer);
  if (toast.value) timer = setTimeout(dismiss, duration);
}

watch(() => toast.value?.id, resume);
onBeforeUnmount(pause);
</script>

<style lang="scss" src="./styles.scss"></style>

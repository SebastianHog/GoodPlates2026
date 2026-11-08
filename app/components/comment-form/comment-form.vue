<template>
  <form class="comment-form" :class="{ 'comment-form--reply': reply }" @submit.prevent="submit">
    <label :for="fieldId" class="comment-form__label">{{ label }}</label>
    <textarea
      :id="fieldId"
      ref="field"
      v-model="body"
      class="comment-form__field"
      :placeholder="placeholder"
      :maxlength="COMMENT_LIMITS.body"
      :aria-invalid="tooLong || undefined"
      :aria-describedby="nearLimit ? countId : undefined"
      rows="2"
      @keydown.enter.ctrl.exact.prevent="submit"
      @keydown.enter.meta.exact.prevent="submit"
      @keydown.esc="cancel"
    />

    <div class="comment-form__footer">
      <span v-if="nearLimit" :id="countId" class="comment-form__count" aria-live="polite">
        {{ $t("comments.remaining", COMMENT_LIMITS.body - body.length) }}
      </span>
      <div class="comment-form__buttons">
        <button v-if="reply" type="button" class="comment-form__cancel" @click="cancel">
          {{ $t("comments.cancel") }}
        </button>
        <button type="submit" class="comment-form__submit" :disabled="!canSend">
          {{ $t(sending ? "comments.posting" : reply ? "comments.postReply" : "comments.post") }}
        </button>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
// A box to write a comment or a reply. `send` saves it; the text stays when that fails so nothing is lost
const props = defineProps<{
  label: string;
  placeholder: string;
  send: (body: string) => Promise<void>;
  reply?: boolean;
  autofocus?: boolean;
}>();

const emit = defineEmits<{ cancel: [] }>();

const fieldId = useId();
const countId = useId();
const field = useTemplateRef("field");
const body = ref("");
const sending = ref(false);

const trimmed = computed(() => body.value.trim());
const tooLong = computed(() => body.value.length > COMMENT_LIMITS.body);
// Only show the countdown when it matters
const nearLimit = computed(() => body.value.length > COMMENT_LIMITS.body - 100);
const canSend = computed(() => !sending.value && trimmed.value.length > 0 && !tooLong.value);

onMounted(() => {
  if (props.autofocus) field.value?.focus();
});

async function submit() {
  if (!canSend.value) return;
  sending.value = true;
  try {
    await props.send(trimmed.value);
    body.value = "";
  } catch {
    // The parent says what went wrong; keep the text so it can be sent again
  } finally {
    sending.value = false;
  }
}

function cancel() {
  if (props.reply && !sending.value) emit("cancel");
}
</script>

<style lang="scss" src="./styles.scss"></style>

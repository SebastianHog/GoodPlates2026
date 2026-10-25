<template>
  <div class="auth-panel">
    <segmented-tabs
      v-model="tab"
      :tabs="tabs"
      :label="$t('auth.tabsLabel')"
      panel-id="auth-panel"
      id-prefix="auth-tab"
    />

    <div id="auth-panel" role="tabpanel" :aria-labelledby="`auth-tab-${tab}`">
      <form class="auth-panel__panel" @submit.prevent="submit">
      <div class="auth-panel__intro">
        <h1 class="auth-panel__title">{{ $t(`auth.${tab}.title`) }}</h1>
        <p class="auth-panel__subtitle">{{ $t(`auth.${tab}.subtitle`) }}</p>
      </div>

      <template v-if="tab === 'signup'">
        <div class="auth-panel__field">
          <label class="auth-panel__label" for="auth-display-name">{{
            $t("auth.fields.name")
          }}</label>
          <input
            id="auth-display-name"
            v-model="displayName"
            class="auth-panel__input"
            type="text"
            autocomplete="name"
            maxlength="40"
            required
          />
        </div>

        <div class="auth-panel__field">
          <label class="auth-panel__label" for="auth-handle">{{
            $t("auth.fields.username")
          }}</label>
          <div class="auth-panel__affix">
            <span class="auth-panel__prefix" aria-hidden="true">@</span>
            <input
              id="auth-handle"
              :value="handle"
              class="auth-panel__input auth-panel__input--prefixed"
              type="text"
              autocomplete="username"
              autocapitalize="none"
              spellcheck="false"
              pattern="[a-z0-9_]{3,20}"
              required
              @input="
                handle = ($event.target as HTMLInputElement).value.toLowerCase()
              "
            />
          </div>
        </div>
      </template>

      <div class="auth-panel__field">
        <label class="auth-panel__label" for="auth-email">{{
          $t("auth.fields.email")
        }}</label>
        <input
          id="auth-email"
          v-model="email"
          class="auth-panel__input"
          type="email"
          autocomplete="email"
          :placeholder="$t('auth.fields.emailPlaceholder')"
          required
        />
      </div>

      <div class="auth-panel__field">
        <label class="auth-panel__label" for="auth-password">{{
          $t("auth.fields.password")
        }}</label>
        <div class="auth-panel__affix">
          <input
            id="auth-password"
            v-model="password"
            class="auth-panel__input auth-panel__input--password"
            :type="showPassword ? 'text' : 'password'"
            :autocomplete="
              tab === 'login' ? 'current-password' : 'new-password'
            "
            :minlength="tab === 'signup' ? 8 : undefined"
            :aria-describedby="
              tab === 'signup' ? 'auth-password-hint' : undefined
            "
            required
          />
          <button
            class="auth-panel__toggle"
            type="button"
            aria-controls="auth-password"
            @click="showPassword = !showPassword"
          >
            {{
              $t(
                showPassword
                  ? "auth.fields.hidePassword"
                  : "auth.fields.showPassword",
              )
            }}
            <span class="visually-hidden">{{
              $t("auth.fields.passwordSuffix")
            }}</span>
          </button>
        </div>
        <p
          v-if="tab === 'signup'"
          id="auth-password-hint"
          class="auth-panel__hint"
        >
          {{ $t("auth.fields.passwordHint") }}
        </p>
      </div>

      <p v-if="error" class="auth-panel__error" role="alert">{{ error }}</p>

      <button class="auth-panel__submit" type="submit" :disabled="pending">
        {{ $t(`auth.${tab}.${pending ? "pending" : "submit"}`) }}
      </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
// The log in / sign up tabs and their form
type Tab = "login" | "signup";

const { t } = useI18n();

const tabs = computed<{ id: Tab; label: string }[]>(() => [
  { id: "login", label: t("auth.login.tab") },
  { id: "signup", label: t("auth.signup.tab") },
]);

const route = useRoute();
const router = useRouter();
const { fetch: refreshSession } = useUserSession();

const tab = ref<Tab>(route.query.tab === "signup" ? "signup" : "login");

// Check the url for which version of the form to show, singup or login.
watch(
  () => route.query.tab,
  (value) => (tab.value = value === "signup" ? "signup" : "login"),
);

const displayName = ref("");
const handle = ref("");
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const pending = ref(false);
const error = ref("");

const redirect = computed(() => {
  const value = route.query.redirect;
  // Only same-site, absolute paths: no "//host" or "/\host" tricks that point at another site
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
    ? value
    : "/";
});

watch(tab, (next) => {
  error.value = "";
  router.replace({
    query: { ...route.query, tab: next === "signup" ? "signup" : undefined },
  });
});

async function submit() {
  pending.value = true;
  error.value = "";
  try {
    if (tab.value === "login") {
      await $fetch("/api/auth/login", {
        method: "POST",
        body: { email: email.value, password: password.value },
      });
    } else {
      await $fetch("/api/auth/signup", {
        method: "POST",
        body: {
          displayName: displayName.value,
          hiddenName: handle.value,
          email: email.value,
          password: password.value,
        },
      });
    }
    await refreshSession();
  } catch (e) {
    // The server names the problem with an i18n key when it is something the user can fix
    const { data, statusCode } = e as { data?: { data?: { messageKey?: string } }; statusCode?: number };
    const messageKey = data?.data?.messageKey;

    if (statusCode === 429 && messageKey) {
      error.value = t(messageKey);
    } else if (tab.value === "login") {
      error.value = t("auth.errors.wrongLogin");
    } else {
      error.value = messageKey ? t(messageKey) : t("auth.errors.signupFailed");
    }
    return;
  } finally {
    pending.value = false;
  }

  // Navigate only after a clean sign-in, so a rejected redirect target never shows a login error
  await navigateTo(redirect.value);
}
</script>

<style lang="scss" src="./styles.scss"></style>

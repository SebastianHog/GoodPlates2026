<template>
  <div class="auth-panel">
    <segmented-tabs
      v-model="tab"
      :tabs="tabs"
      label="Account"
      panel-id="auth-panel"
      id-prefix="auth-tab"
    />

  <form
    id="auth-panel"
    class="auth-panel__panel"
    role="tabpanel"
    :aria-labelledby="`auth-tab-${tab}`"
    @submit.prevent="submit"
  >
    <div class="auth-panel__intro">
      <h1 class="auth-panel__title">{{ copy.title }}</h1>
      <p class="auth-panel__subtitle">{{ copy.subtitle }}</p>
    </div>

    <template v-if="tab === 'signup'">
      <div class="auth-panel__field">
        <label class="auth-panel__label" for="auth-display-name"
          >Name</label
        >
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
        <label class="auth-panel__label" for="auth-handle">Username</label>
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
              handle = (
                $event.target as HTMLInputElement
              ).value.toLowerCase()
            "
          />
        </div>
      </div>
    </template>

    <div class="auth-panel__field">
      <label class="auth-panel__label" for="auth-email">Email</label>
      <input
        id="auth-email"
        v-model="email"
        class="auth-panel__input"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
        required
      />
    </div>

    <div class="auth-panel__field">
      <label class="auth-panel__label" for="auth-password">Password</label>
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
          {{ showPassword ? "Hide" : "Show"
          }}<span class="visually-hidden"> password</span>
        </button>
      </div>
      <p
        v-if="tab === 'signup'"
        id="auth-password-hint"
        class="auth-panel__hint"
      >
        At least 8 characters.
      </p>
    </div>

    <p v-if="error" class="auth-panel__error" role="alert">{{ error }}</p>

    <button class="auth-panel__submit" type="submit" :disabled="pending">
      {{ pending ? copy.pending : copy.submit }}
    </button>
  </form>
  </div>
</template>

<script setup lang="ts">
// The log in / sign up tabs and their form
type Tab = "login" | "signup";

const tabs: { id: Tab; label: string }[] = [
  { id: "login", label: "Log in" },
  { id: "signup", label: "Sign up" },
];

const content = {
  login: {
    title: "Welcome back",
    subtitle: "Log in to share your recipes.",
    submit: "Log in",
    pending: "Logging in…",
  },
  signup: {
    title: "Join GoodPlates",
    subtitle: "Post what you cook and see what others are making.",
    submit: "Create account",
    pending: "Creating account…",
  },
};

const route = useRoute();
const router = useRouter();
const { fetch: refreshSession } = useUserSession();

const tab = ref<Tab>(route.query.tab === "signup" ? "signup" : "login");

// Check the url for which version of the form to show, singup or login.
watch(
  () => route.query.tab,
  (value) => (tab.value = value === "signup" ? "signup" : "login"),
);
const copy = computed(() => content[tab.value]);

const displayName = ref("");
const handle = ref("");
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const pending = ref(false);
const error = ref("");

// Switching tabs also updates ?tab= so the sign-up form can be linked to directly
watch(tab, (next) => {
  error.value = "";
  router.replace({ query: next === "signup" ? { tab: "signup" } : {} });
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
    await navigateTo("/");
  } catch (e) {
    const { statusCode, statusMessage } = e as {
      statusCode?: number;
      statusMessage?: string;
    };
    if (tab.value === "login") {
      error.value = "Wrong email or password. Please try again.";
    } else if (statusCode === 400 || statusCode === 409) {
      error.value = `${statusMessage}.`;
    } else {
      error.value = "Could not create your account. Please try again.";
    }
  } finally {
    pending.value = false;
  }
}
</script>

<style lang="scss" src="./styles.scss"></style>

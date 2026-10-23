<template>
  <div class="login-form" :class="{ 'login-form--spread': topPost }">
    <figure v-if="topPost" class="login-form__cover">
      <img
        v-bind="imageSources(topPost.image)"
        sizes="(min-width: 52em) 28rem, 100vw"
        :alt="topPost.title"
        class="login-form__photo"
      />
      <figcaption class="login-form__caption">
        <span class="login-form__caption-title">{{ topPost.title }}</span>
        <span class="login-form__caption-author">
          <user-circle-icon size="small" :user="topPost.author" />
          {{ topPost.author.displayName }}
        </span>
      </figcaption>
    </figure>

    <div class="login-form__page">
      <div
        class="login-form__tabs"
        :class="`login-form__tabs--${tab}`"
        role="tablist"
        aria-label="Account"
      >
        <button
          v-for="item in tabs"
          :id="`auth-tab-${item.id}`"
          :key="item.id"
          class="login-form__tab"
          type="button"
          role="tab"
          :aria-selected="tab === item.id"
          aria-controls="auth-panel"
          :tabindex="tab === item.id ? 0 : -1"
          @click="selectTab(item.id)"
          @keydown="onTabKeydown"
        >
          {{ item.label }}
        </button>
      </div>

      <form
        id="auth-panel"
        class="login-form__panel"
        role="tabpanel"
        :aria-labelledby="`auth-tab-${tab}`"
        @submit.prevent="submit"
      >
        <div class="login-form__intro">
          <h1 class="login-form__title">{{ copy.title }}</h1>
          <p class="login-form__subtitle">{{ copy.subtitle }}</p>
        </div>

        <template v-if="tab === 'signup'">
          <div class="login-form__field">
            <label class="login-form__label" for="auth-display-name"
              >Name</label
            >
            <input
              id="auth-display-name"
              v-model="displayName"
              class="login-form__input"
              type="text"
              autocomplete="name"
              maxlength="40"
              required
            />
          </div>

          <div class="login-form__field">
            <label class="login-form__label" for="auth-handle">Username</label>
            <div class="login-form__affix">
              <span class="login-form__prefix" aria-hidden="true">@</span>
              <input
                id="auth-handle"
                :value="handle"
                class="login-form__input login-form__input--prefixed"
                type="text"
                autocomplete="username"
                autocapitalize="none"
                spellcheck="false"
                pattern="[a-z0-9_]{3,20}"
                aria-describedby="auth-handle-hint"
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

        <div class="login-form__field">
          <label class="login-form__label" for="auth-email">Email</label>
          <input
            id="auth-email"
            v-model="email"
            class="login-form__input"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <div class="login-form__field">
          <label class="login-form__label" for="auth-password">Password</label>
          <div class="login-form__affix">
            <input
              id="auth-password"
              v-model="password"
              class="login-form__input login-form__input--password"
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
              class="login-form__toggle"
              type="button"
              aria-controls="auth-password"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? "Hide" : "Show"
              }}<span class="login-form__visually-hidden"> password</span>
            </button>
          </div>
          <p
            v-if="tab === 'signup'"
            id="auth-password-hint"
            class="login-form__hint"
          >
            At least 8 characters.
          </p>
        </div>

        <p v-if="error" class="login-form__error" role="alert">{{ error }}</p>

        <button class="login-form__submit" type="submit" :disabled="pending">
          {{ pending ? copy.pending : copy.submit }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
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

// most recent post in left page of the booklet
const { data: posts } = await usePosts();
const topPost = computed(() => posts.value?.find((post) => post.image));

const tab = ref<Tab>(route.query.tab === "signup" ? "signup" : "login");

// Check the url for which version of the form to show, singup or login.
watch(
  () => route.query.tab,
  (value) => {
    tab.value = value === "signup" ? "signup" : "login";
    error.value = "";
  },
);
const copy = computed(() => content[tab.value]);

const displayName = ref("");
const handle = ref("");
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const pending = ref(false);
const error = ref("");

function selectTab(next: Tab) {
  if (next === tab.value) return;
  tab.value = next;
  error.value = "";
  router.replace({ query: next === "signup" ? { tab: "signup" } : {} });
}

// Arrow keys move between tabs, as in the WAI-ARIA tabs pattern
function onTabKeydown(event: KeyboardEvent) {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  const next = tab.value === "login" ? "signup" : "login";
  selectTab(next);
  nextTick(() => document.getElementById(`auth-tab-${next}`)?.focus());
}

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

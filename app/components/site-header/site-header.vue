<template>
  <header class="site-header">
    <NuxtLink to="/" class="site-header__brand" aria-label="GoodPlates home">
      <img :src="logoUrl" class="site-header__mark" alt="" width="111" height="108" />
      <span class="site-header__wordmark">Good<strong>Plates</strong></span>
    </NuxtLink>

    <form class="site-header__search" role="search" @submit.prevent="search">
      <label class="site-header__visually-hidden" for="site-search">Search recipes</label>
      <svg class="site-header__search-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </svg>
      <input
        id="site-search"
        v-model="query"
        class="site-header__search-input"
        type="search"
        name="q"
        placeholder="Search recipes"
        enterkeyhint="search"
        maxlength="100"
      />
    </form>

    <nav class="site-header__actions" aria-label="Account">
      <template v-if="loggedIn && user">
        <NuxtLink to="/create" class="site-header__button site-header__button--primary">
          <svg class="site-header__icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span class="site-header__label">New post</span>
        </NuxtLink>

        <div ref="accountRef" class="site-header__account">
          <button
            class="site-header__account-button"
            type="button"
            :aria-expanded="menuOpen"
            aria-controls="account-menu"
            @click="menuOpen = !menuOpen"
          >
            <user-circle-icon size="medium" :user="user" />
            <span class="site-header__visually-hidden">Account</span>
            <svg class="site-header__chevron" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m7 10 5 5 5-5" />
            </svg>
          </button>

          <div v-show="menuOpen" id="account-menu" class="site-header__menu">
            <p class="site-header__menu-user">
              <span class="site-header__menu-name">{{ user.displayName }}</span>
              <span class="site-header__menu-handle">@{{ user.hiddenName }}</span>
            </p>
            <button class="site-header__menu-item" type="button" @click="logout">Log out</button>
          </div>
        </div>
      </template>

      <template v-else>
        <NuxtLink to="/login" class="site-header__button">Log in</NuxtLink>
        <NuxtLink to="/login?tab=signup" class="site-header__button site-header__button--primary">
          Sign up
        </NuxtLink>
      </template>
    </nav>
  </header>
</template>

<script setup lang="ts">
import logoUrl from "~/assets/GoodPlatesLogo.svg";

const route = useRoute();
const { loggedIn, user, clear } = useUserSession();

const query = ref(typeof route.query.q === "string" ? route.query.q : "");
const menuOpen = ref(false);
const accountRef = ref<HTMLElement>();

// Keep the field in step with the URL, e.g. after "Show all" or the back button
watch(
  () => route.query.q,
  (q) => (query.value = typeof q === "string" ? q : ""),
);

// Close the menu when navigating away
watch(() => route.fullPath, () => (menuOpen.value = false));

function search() {
  const q = query.value.trim();
  navigateTo({ path: "/", query: q ? { q } : {} });
}

async function logout() {
  menuOpen.value = false;
  await clear();
  await navigateTo("/");
}

// Close on a click outside the menu or on Escape
function onDocumentClick(event: MouseEvent) {
  if (menuOpen.value && !accountRef.value?.contains(event.target as Node)) {
    menuOpen.value = false;
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && menuOpen.value) {
    menuOpen.value = false;
    accountRef.value?.querySelector("button")?.focus();
  }
}

onMounted(() => {
  document.addEventListener("click", onDocumentClick);
  document.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick);
  document.removeEventListener("keydown", onKeydown);
});
</script>

<style lang="scss" src="./styles.scss"></style>

<template>
  <div ref="root" class="account-menu">
    <button
      ref="button"
      class="account-menu__button"
      type="button"
      :aria-expanded="open"
      aria-controls="account-menu"
      @click="open = !open"
    >
      <user-circle-icon size="medium" :user="user" />
      <span class="visually-hidden">{{ $t("accountMenu.account") }}</span>
      <app-icon name="chevron-down" class="account-menu__chevron" />
    </button>

    <div v-show="open" id="account-menu" class="account-menu__panel">
      <p class="account-menu__user">
        <span class="account-menu__name">{{ user.displayName }}</span>
        <span class="account-menu__handle">@{{ user.hiddenName }}</span>
      </p>
      <NuxtLink :to="`/u/${user.hiddenName}`" class="account-menu__item">{{
        $t("accountMenu.profile")
      }}</NuxtLink>
      <NuxtLink to="/bookmarks" class="account-menu__item">{{ $t("accountMenu.bookmarks") }}</NuxtLink>
      <button class="account-menu__item" type="button" @click="logout">{{ $t("accountMenu.logOut") }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
// The avatar button in the header and the small menu it opens
defineProps<{ user: { displayName: string; hiddenName: string } }>();

const route = useRoute();
const { fetch: refreshSession } = useUserSession();

const open = ref(false);
const root = ref<HTMLElement>();
const button = ref<HTMLButtonElement>();

// Close when navigating, on a click outside the menu, or on Escape
watch(
  () => route.fullPath,
  () => (open.value = false),
);

function onDocumentClick(event: MouseEvent) {
  if (open.value && !root.value?.contains(event.target as Node)) {
    open.value = false;
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && open.value) {
    open.value = false;
    button.value?.focus();
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

async function logout() {
  open.value = false;
  // Revokes the session server-side (so a copied cookie stops working), then refreshes client state
  await $fetch("/api/auth/logout", { method: "POST" });
  await refreshSession();
  await navigateTo("/");
}
</script>

<style lang="scss" src="./styles.scss"></style>

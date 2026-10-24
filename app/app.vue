<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import logoUrl from "~/assets/GoodPlatesLogo.svg";

const { locale } = useI18n();

// The logo is also the browser tab icon; the page language follows the chosen locale
useHead({
  htmlAttrs: { lang: locale },
  link: [{ rel: "icon", type: "image/svg+xml", href: logoUrl }],
});
</script>

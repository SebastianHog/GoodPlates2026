<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import logoUrl from "~/assets/GoodPlatesLogo.svg";

// The logo is also the browser tab icon
useHead({
  link: [{ rel: "icon", type: "image/svg+xml", href: logoUrl }],
});
</script>

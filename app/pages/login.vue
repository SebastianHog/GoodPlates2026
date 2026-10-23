<template>
  <section>
    <login-form />
  </section>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: "guest" });

const route = useRoute();

useHead({
  title: () => (route.query.tab === "signup" ? "Sign up · GoodPlates" : "Log in · GoodPlates"),
});
</script>

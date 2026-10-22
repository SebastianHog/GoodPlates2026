<template>
  <section>
    <login-form />
  </section>
</template>

<script lang="ts" setup>
const route = useRoute();

useHead({
  title: () => (route.query.tab === "signup" ? "Sign up · GoodPlates" : "Log in · GoodPlates"),
});
</script>

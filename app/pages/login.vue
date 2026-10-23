<template>
  <section>
    <login-form />
  </section>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: "guest" });

const route = useRoute();

const { t } = useI18n();

useHead({
  title: () => t("site.pageTitle", { page: t(route.query.tab === "signup" ? "auth.signup.pageTitle" : "auth.login.pageTitle") }),
});
</script>

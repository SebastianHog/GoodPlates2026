<template>
  <header class="site-header">
    <NuxtLink to="/" class="site-header__brand" :aria-label="$t('site.home')">
      <img :src="logoUrl" class="site-header__mark" alt="" width="111" height="108" />
      <span class="site-header__wordmark">Good<strong>Plates</strong></span>
    </NuxtLink>

    <search-field class="site-header__search" />

    <nav class="site-header__actions" :aria-label="$t('header.nav')">
      <template v-if="loggedIn && user">
        <NuxtLink to="/create" class="site-header__button site-header__button--primary">
          <app-icon name="plus" />
          <span class="site-header__label">{{ $t("header.newPost") }}</span>
        </NuxtLink>
        <account-menu :user="user" />
      </template>

      <template v-else>
        <NuxtLink to="/login" class="site-header__button">{{ $t("header.logIn") }}</NuxtLink>
        <NuxtLink to="/login?tab=signup" class="site-header__button site-header__button--primary">
          {{ $t("header.signUp") }}
        </NuxtLink>
      </template>
    </nav>
  </header>
</template>

<script setup lang="ts">
import logoUrl from "~/assets/GoodPlatesLogo.svg";

const { loggedIn, user } = useUserSession();
</script>

<style lang="scss" src="./styles.scss"></style>

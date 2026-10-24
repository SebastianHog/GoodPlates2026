<template>
  <label class="language-switcher">
    <span class="language-switcher__label">{{ $t("languageSwitcher.label") }}</span>
    <select class="language-switcher__select" @change="onChange">
      <option
        v-for="option in locales"
        :key="option.code"
        :value="option.code"
        :lang="option.language"
        :selected="option.code === locale"
      >
        {{ option.name }}
      </option>
    </select>
  </label>
</template>

<script setup lang="ts">
// Picks the site language; each language is named in itself. The choice is kept in a cookie
const { locale, locales, setLocale } = useI18n();

function onChange(event: Event) {
  setLocale((event.target as HTMLSelectElement).value as typeof locale.value);
}
</script>

<style lang="scss" src="./styles.scss"></style>

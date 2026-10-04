<template>
  <div>{{ title }}</div>
</template>

<script setup lang="ts">
const props = defineProps({
  title: String,
  author: String,
});
</script>

<style lang="scss" src="./styles.scss"></style>

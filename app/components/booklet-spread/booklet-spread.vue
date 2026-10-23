<template>
  <div class="booklet-spread">
    <div class="booklet-spread__page booklet-spread__page--left">
      <slot name="left" />
    </div>
    <div class="booklet-spread__page booklet-spread__page--right">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup lang="ts">
// An open booklet: two pages with a shadow in the fold, stacked into one column on phones.
// Set the page widths with --booklet-left and --booklet-right (both 1fr by default).
</script>

<style lang="scss" src="./styles.scss"></style>

<template>
  <div class="photo-placeholder" aria-hidden="true">
    <!-- Two empty plates, drawn like the logo -->
    <svg class="photo-placeholder__plates" viewBox="0 0 111 108" fill="none">
      <circle cx="36.67" cy="36.67" r="35.67" />
      <circle cx="36.52" cy="36.52" r="18.02" />
      <circle cx="73.67" cy="70.67" r="35.67" class="photo-placeholder__front" />
      <circle cx="73.52" cy="70.52" r="18.02" />
    </svg>
  </div>
</template>

<script setup lang="ts">
// Stands in for the photo of a post that has none. Fills its parent, so the parent sets the size
</script>

<style lang="scss" src="./styles.scss"></style>

<template>
  <div class="layout">
    <site-header />

    <main class="layout__content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.layout__content {
  margin: 0 auto;
  max-width: var(--content-max-width);
  padding: 2rem 1.5rem;
}
</style>

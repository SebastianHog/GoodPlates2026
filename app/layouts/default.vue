<template>
  <div class="layout">
    <site-header />
    <app-toast :duration="5000" />

    <main class="layout__content">
      <slot />
    </main>

    <footer class="layout__footer">
      <language-switcher />
    </footer>
  </div>
</template>

<style scoped>
.layout__content {
  margin: 0 auto;
  max-width: var(--content-max-width);
  padding: 2rem 1.5rem;
}

.layout__footer {
  display: flex;
  justify-content: center;
  padding: 1.5rem;
  border-top: 1px solid var(--color-border);
}
</style>

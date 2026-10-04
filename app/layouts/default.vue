<template>
  <div class="layout">
    <header class="layout__header">
      <NuxtLink to="/">GoodPlates</NuxtLink>
    </header>

    <main class="layout__content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.layout__header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.layout__header a {
  color: inherit;
  font-weight: 700;
  text-decoration: none;
}

.layout__content {
  margin: 0 auto;
  max-width: var(--content-max-width);
  padding: 2rem 1.5rem;
}
</style>

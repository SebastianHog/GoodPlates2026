<template>
  <section>
    <div class="posts-container">
      <recipe-post v-for="x in 10" :title="'hello ' + x" />
    </div>
  </section>
</template>

<style lang="scss">
.posts-container {
  background: red;
}
</style>

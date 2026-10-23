<template>
  <div class="recipe-details">
    <p v-if="caption" class="recipe-details__caption">{{ caption }}</p>

    <div class="recipe-details__lists">
      <section v-if="ingredients.length">
        <h3 class="recipe-details__label">
          Ingredients<template v-if="servings"> · {{ servings }}</template>
        </h3>
        <ul class="recipe-details__list">
          <li v-for="(ingredient, index) in ingredients" :key="index">{{ ingredient }}</li>
        </ul>
      </section>

      <section v-if="steps.length">
        <h3 class="recipe-details__label">Steps</h3>
        <ol class="recipe-details__list recipe-details__list--steps">
          <li v-for="(step, index) in steps" :key="index">{{ step }}</li>
        </ol>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// The readable recipe: description, ingredients and numbered steps
defineProps<Pick<IPostContent, "caption" | "ingredients" | "steps" | "servings">>();
</script>

<style lang="scss" src="./styles.scss"></style>

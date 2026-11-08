<template>
  <article class="recipe-article">
    <booklet-spread class="recipe-article__spread">
      <template #left>
        <photo-carousel :images="images" :title="title" sizes="(min-width: 52em) 28rem, 100vw" />
      </template>

      <template #right>
        <!-- The byline sits under the text like a signature (as in the feed), and on wide screens at the foot of the page -->
        <div class="recipe-article__intro">
          <h1 class="recipe-article__title">{{ title }}</h1>
          <p v-if="summary" class="recipe-article__summary">{{ summary }}</p>
          <template v-for="(block, index) in captionBlocks" :key="index">
            <p v-if="block.kind === 'text'" class="recipe-article__caption">{{ block.text }}</p>
            <ul v-else class="recipe-article__facts">
              <li v-for="(fact, factIndex) in block.items" :key="factIndex">{{ fact }}</li>
            </ul>
          </template>
        </div>

        <div class="recipe-article__meta">
          <post-byline :author="author" :created-at="createdAt" prominent />
          <post-actions
            :id="id"
            :title="title"
            :like-count="likeCount"
            :liked-by-me="likedByMe"
            :bookmarked-by-me="bookmarkedByMe"
            :author-id="author.id"
            share
          />
        </div>
      </template>
    </booklet-spread>

    <div v-if="ingredients.length || steps.length" class="recipe-article__recipe">
      <recipe-details
        :id="id"
        :ingredients="ingredients"
        :steps="steps"
        :servings="servings"
        @complete="allStepsDone = $event"
      />

      <cook-button
        class="recipe-article__cooked"
        :post-id="id"
        :cook-count="cookCount"
        :cooked-by-me="cookedByMe"
        :all-steps-done="allStepsDone"
      />
    </div>

    <post-comments :post-id="id" :post-author-id="author.id" />

    <author-posts :author="author" :exclude-id="id" />
  </article>
</template>

<script setup lang="ts">
const props = defineProps<IPostContent>();

const { t } = useI18n();
const allStepsDone = ref(false);
const summary = computed(() => formatRecipeSummary(props, t));
const captionBlocks = computed(() => splitCaption(props.caption));
</script>

<style lang="scss" src="./styles.scss"></style>

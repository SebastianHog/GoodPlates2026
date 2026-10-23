import type { Composer } from "vue-i18n";

// "3 ingredients · 4 steps · 25 min", leaving out whatever the recipe does not have
export function formatRecipeSummary(
  post: Pick<IPostContent, "ingredients" | "steps" | "totalTimeMinutes">,
  t: Composer["t"],
): string {
  return [
    post.ingredients.length && t("post.summary.ingredients", post.ingredients.length),
    post.steps.length && t("post.summary.steps", post.steps.length),
    post.totalTimeMinutes && t("post.summary.minutes", { n: post.totalTimeMinutes }),
  ]
    .filter(Boolean)
    .join(" · ");
}

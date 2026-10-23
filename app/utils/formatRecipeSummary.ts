import type { Composer } from "vue-i18n";

// "3 ingredients · 4 steps · 25 min", leaving out whatever the recipe does not have
export function formatRecipeSummary(
  post: Pick<IPostContent, "ingredients" | "steps" | "totalTimeMinutes">,
  t: Composer["t"],
): string {
  return [
    post.ingredients.length && t("post.summary.ingredients", post.ingredients.length),
    post.steps.length && t("post.summary.steps", post.steps.length),
    post.totalTimeMinutes && formatDuration(post.totalTimeMinutes, t),
  ]
    .filter(Boolean)
    .join(" · ");
}

// "45 min", "2 h", "1 h 30 min": long cooking times read as hours
function formatDuration(minutes: number, t: Composer["t"]): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (!hours) return t("post.summary.minutes", { n: minutes });
  if (!rest) return t("post.summary.hours", { n: hours });
  return t("post.summary.hoursMinutes", { h: hours, m: rest });
}

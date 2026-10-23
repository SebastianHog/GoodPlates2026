// "3 ingredients · 4 steps · 25 min", leaving out whatever the recipe does not have
export function formatRecipeSummary(post: Pick<IPostContent, "ingredients" | "steps" | "totalTimeMinutes">): string {
  const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

  return [
    post.ingredients.length && plural(post.ingredients.length, "ingredient"),
    post.steps.length && plural(post.steps.length, "step"),
    post.totalTimeMinutes && `${post.totalTimeMinutes} min`,
  ]
    .filter(Boolean)
    .join(" · ");
}

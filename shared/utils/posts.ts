export const POST_LIMITS = {
  photos: 6,
  title: 80,
  // Free text: a short note or a long story, whatever the creator wants to say
  caption: 5000,
  ingredients: 30,
  steps: 20,
  line: 300,
  servings: 40,
  totalTimeMinutes: 7 * 24 * 60,
} as const;

export type PostField = "images" | "title" | "caption" | "ingredients" | "steps" | "servings" | "totalTimeMinutes";

// Checks a create/edit form, returning the cleaned post or the first problem per field
export function validatePostInput(
  raw: unknown,
): { data: PostInput; errors: null } | { data: null; errors: Partial<Record<PostField, string>> } {
  const body = (raw ?? {}) as Record<string, unknown>;
  const errors: Partial<Record<PostField, string>> = {};

  const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  const lines = (value: unknown) =>
    Array.isArray(value) ? value.map(text).filter((line) => line.length > 0) : [];

  const images = Array.isArray(body.images) ? body.images.filter((key) => typeof key === "string") : [];
  const title = text(body.title);
  const caption = text(body.caption);
  const ingredients = lines(body.ingredients);
  const steps = lines(body.steps);
  const servings = text(body.servings);
  const time = body.totalTimeMinutes;
  const totalTimeMinutes = time === null || time === undefined || time === "" ? null : Number(time);

  if (images.length === 0) errors.images = "Add at least one photo";
  else if (images.length > POST_LIMITS.photos) errors.images = `Add at most ${POST_LIMITS.photos} photos`;
  else if (!images.every((key) => IMAGE_KEY_PATTERN.test(key))) errors.images = "A photo did not upload correctly";

  if (!title) errors.title = "Give your recipe a title";
  else if (title.length > POST_LIMITS.title) errors.title = `Keep the title under ${POST_LIMITS.title} characters`;

  if (caption.length > POST_LIMITS.caption) errors.caption = `Keep the description under ${POST_LIMITS.caption} characters`;

  if (ingredients.length === 0) errors.ingredients = "Add at least one ingredient";
  else if (ingredients.length > POST_LIMITS.ingredients) errors.ingredients = `Add at most ${POST_LIMITS.ingredients} ingredients`;
  else if (ingredients.some((line) => line.length > POST_LIMITS.line)) errors.ingredients = "One ingredient is too long";

  if (steps.length === 0) errors.steps = "Add at least one step";
  else if (steps.length > POST_LIMITS.steps) errors.steps = `Add at most ${POST_LIMITS.steps} steps`;
  else if (steps.some((line) => line.length > POST_LIMITS.line)) errors.steps = "One step is too long";

  if (servings.length > POST_LIMITS.servings) errors.servings = `Keep servings under ${POST_LIMITS.servings} characters`;

  if (
    totalTimeMinutes !== null &&
    (!Number.isInteger(totalTimeMinutes) || totalTimeMinutes < 1 || totalTimeMinutes > POST_LIMITS.totalTimeMinutes)
  ) {
    errors.totalTimeMinutes = "Enter the time in whole minutes";
  }

  if (Object.keys(errors).length > 0) {
    return { data: null, errors };
  }

  return { data: { images, title, caption, ingredients, steps, servings, totalTimeMinutes }, errors: null };
}

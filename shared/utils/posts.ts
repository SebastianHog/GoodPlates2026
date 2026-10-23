// How many posts one request returns: a page of a feed or profile, and the Discover list
export const POST_PAGE_SIZE = 20;
export const DISCOVER_SIZE = 30;

// Where the next page starts: "<createdAt>_<id>" of the last post shown, sent as ?before=
export function pageCursor(post: Pick<IPostContent, "createdAt" | "id">): string {
  return `${post.createdAt}_${post.id}`;
}

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

// Checks a create/edit form, returning the cleaned post or the first problem per field.
// Problems are i18n keys (see i18n/locales); translate them with POST_LIMITS as the values.
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

  if (images.length === 0) errors.images = "validation.photosRequired";
  else if (images.length > POST_LIMITS.photos) errors.images = "validation.photosMax";
  else if (!images.every((key) => IMAGE_KEY_PATTERN.test(key))) errors.images = "validation.photoBroken";

  if (!title) errors.title = "validation.titleRequired";
  else if (title.length > POST_LIMITS.title) errors.title = "validation.titleMax";

  if (caption.length > POST_LIMITS.caption) errors.caption = "validation.captionMax";

  if (ingredients.length === 0) errors.ingredients = "validation.ingredientsRequired";
  else if (ingredients.length > POST_LIMITS.ingredients) errors.ingredients = "validation.ingredientsMax";
  else if (ingredients.some((line) => line.length > POST_LIMITS.line)) errors.ingredients = "validation.ingredientTooLong";

  if (steps.length === 0) errors.steps = "validation.stepsRequired";
  else if (steps.length > POST_LIMITS.steps) errors.steps = "validation.stepsMax";
  else if (steps.some((line) => line.length > POST_LIMITS.line)) errors.steps = "validation.stepTooLong";

  if (servings.length > POST_LIMITS.servings) errors.servings = "validation.servingsMax";

  if (
    totalTimeMinutes !== null &&
    (!Number.isInteger(totalTimeMinutes) || totalTimeMinutes < 1 || totalTimeMinutes > POST_LIMITS.totalTimeMinutes)
  ) {
    errors.totalTimeMinutes = "validation.timeInvalid";
  }

  if (Object.keys(errors).length > 0) {
    return { data: null, errors };
  }

  return { data: { images, title, caption, ingredients, steps, servings, totalTimeMinutes }, errors: null };
}

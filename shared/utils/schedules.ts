// A schedule: a name, a description and up to 7 days, each with breakfast, lunch and dinner
export const MEALS = ["breakfast", "lunch", "dinner"] as const;
export type Meal = (typeof MEALS)[number];

export const SCHEDULE_LIMITS = {
  name: 80,
  description: 500,
  days: 7,
  recipesPerMeal: 3,
  // Made and saved together
  perUser: 10,
} as const;

// Post ids for each meal of one day
export type ScheduleDay = Record<Meal, string[]>;

export interface ScheduleInput {
  name: string;
  description: string;
  isPublic: boolean;
  days: ScheduleDay[];
}

export type ScheduleField = "name" | "description" | "days";

const POST_ID_PATTERN = /^[0-9a-f]{24}$/;

export function emptyDay(): ScheduleDay {
  return { breakfast: [], lunch: [], dinner: [] };
}

// Every post id in the schedule, in order, each once
export function schedulePostIds(days: ScheduleDay[]): string[] {
  return [...new Set(days.flatMap((day) => MEALS.flatMap((meal) => day[meal])))];
}

// Checks a create/edit form, returning the cleaned schedule or the first problem per field.
// Problems are i18n keys; translate them with SCHEDULE_LIMITS as the values
export function validateScheduleInput(
  raw: unknown,
): { data: ScheduleInput; errors: null } | { data: null; errors: Partial<Record<ScheduleField, string>> } {
  const body = (raw ?? {}) as Record<string, unknown>;
  const errors: Partial<Record<ScheduleField, string>> = {};

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const isPublic = body.isPublic === true;
  const rawDays = Array.isArray(body.days) ? body.days : [];

  if (!name) errors.name = "schedules.validation.nameRequired";
  else if (name.length > SCHEDULE_LIMITS.name) errors.name = "schedules.validation.nameMax";

  if (description.length > SCHEDULE_LIMITS.description) errors.description = "schedules.validation.descriptionMax";

  const days: ScheduleDay[] = rawDays.map((raw) => {
    const day = (raw ?? {}) as Record<string, unknown>;
    return Object.fromEntries(
      MEALS.map((meal) => {
        const ids = Array.isArray(day[meal]) ? day[meal] : [];
        return [meal, [...new Set(ids.filter((id): id is string => typeof id === "string"))]];
      }),
    ) as ScheduleDay;
  });

  if (days.length === 0) errors.days = "schedules.validation.daysRequired";
  else if (days.length > SCHEDULE_LIMITS.days) errors.days = "schedules.validation.daysMax";
  else if (days.some((day) => MEALS.some((meal) => day[meal].length > SCHEDULE_LIMITS.recipesPerMeal)))
    errors.days = "schedules.validation.mealMax";
  else if (days.some((day) => MEALS.some((meal) => !day[meal].every((id) => POST_ID_PATTERN.test(id)))))
    errors.days = "schedules.validation.recipeBroken";

  if (Object.keys(errors).length > 0) {
    return { data: null, errors };
  }

  return { data: { name, description, isPublic, days }, errors: null };
}

export default defineEventHandler(async (event): Promise<{ id: string }> => {
  const { user } = await requireUserSession(event);
  const { data, errors } = validateScheduleInput(await readBody(event));
  if (errors) {
    throw createError({ statusCode: 400, statusMessage: "Invalid schedule", data: { errors } });
  }

  const result = await createSchedule(user.id, data);
  if (typeof result === "string") throw scheduleProblemError(result);
  return result;
});

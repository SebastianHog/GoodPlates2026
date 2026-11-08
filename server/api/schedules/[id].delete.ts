export default defineEventHandler(async (event): Promise<{ deleted: true }> => {
  const { user } = await requireUserSession(event);
  const result = await deleteSchedule(getRouterParam(event, "id")!, user.id);
  if (result !== true) throw scheduleProblemError(result);
  return { deleted: true };
});

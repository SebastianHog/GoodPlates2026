export default defineEventHandler(async (event): Promise<ISchedule> => {
  const { user } = await getUserSession(event);
  const schedule = await getSchedule(getRouterParam(event, "id")!, user?.id);
  if (!schedule) throw scheduleProblemError("missing");
  return schedule;
});

// GET /api/schedules: public schedules, newest first (?before= for the next page)
// ?mine=1: everything the logged-in user made or saved. ?author=<user id>: that user's public schedules
export default defineEventHandler(async (event): Promise<IScheduleSummary[]> => {
  const { mine, author, limit, before } = getQuery(event);

  if (mine) {
    const { user } = await requireUserSession(event);
    return getOwnSchedules(user.id);
  }

  return getPublicSchedules({
    ownerId: typeof author === "string" ? author : undefined,
    limit: Math.min(Math.max(Math.floor(Number(limit)) || POST_PAGE_SIZE, 1), 50),
    before: typeof before === "string" ? before : undefined,
  });
});

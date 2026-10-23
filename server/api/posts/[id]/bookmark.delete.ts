export default defineEventHandler(async (event): Promise<{ bookmarked: boolean }> => {
  const { user } = await requireUserSession(event);

  if (!(await setPostBookmark(getRouterParam(event, "id")!, user.id, false))) {
    throw createError({ statusCode: 404, statusMessage: "Post not found" });
  }

  return { bookmarked: false };
});

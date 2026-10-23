export default defineEventHandler(async (event): Promise<{ liked: boolean; likeCount: number }> => {
  const { user } = await requireUserSession(event);
  const likeCount = await setPostLike(getRouterParam(event, "id")!, user.id, true);

  if (likeCount === null) {
    throw createError({ statusCode: 404, statusMessage: "Post not found" });
  }

  return { liked: true, likeCount };
});

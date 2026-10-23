export default defineEventHandler(async (event): Promise<IProfile> => {
  const user = await getUserByHandle(getRouterParam(event, "handle")!);
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  const { user: viewer } = await getUserSession(event);
  const [posts, counts, followedByMe] = await Promise.all([
    getPosts(undefined, viewer?.id, user.id),
    getFollowCounts(user.id),
    viewer ? isFollowing(viewer.id, user.id) : false,
  ]);

  return {
    user,
    posts,
    followerCount: counts.followers,
    followingCount: counts.following,
    followedByMe,
  };
});

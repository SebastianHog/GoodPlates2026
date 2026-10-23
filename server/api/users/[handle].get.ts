export default defineEventHandler(async (event): Promise<IProfile> => {
  const user = await getUserByHandle(getRouterParam(event, "handle")!);
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  const { user: viewer } = await getUserSession(event);
  const [posts, postCount, counts, followedByMe] = await Promise.all([
    getPosts({ viewerId: viewer?.id, authorId: user.id }),
    countPostsBy(user.id),
    getFollowCounts(user.id),
    viewer ? isFollowing(viewer.id, user.id) : false,
  ]);

  return {
    user,
    posts,
    postCount,
    followerCount: counts.followers,
    followingCount: counts.following,
    followedByMe,
  };
});

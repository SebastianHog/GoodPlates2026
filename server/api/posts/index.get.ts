export default defineEventHandler(async (event): Promise<IPostContent[]> => {
  const { q, author, feed } = getQuery(event);
  const { user } = await getUserSession(event);
  const search = typeof q === "string" ? q.slice(0, 100) : undefined;
  const authorId = typeof author === "string" ? author : undefined;

  // search and author pages are always newest first
  if (feed === "discover" && !search && !authorId) {
    return getDiscoverPosts(user?.id);
  }

  if (feed === "following" && !search && !authorId) {
    return user ? getFollowingPosts(user.id) : [];
  }

  return getPosts(search, user?.id, authorId);
});

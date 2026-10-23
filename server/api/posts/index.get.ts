export default defineEventHandler(async (event): Promise<IPostContent[]> => {
  const { q, author, feed, limit, before } = getQuery(event);
  const { user } = await getUserSession(event);
  const search = typeof q === "string" ? q.slice(0, 100) : undefined;
  const authorId = typeof author === "string" ? author : undefined;
  const page = {
    limit: Math.min(Math.max(Number(limit) || POST_PAGE_SIZE, 1), 50),
    before: typeof before === "string" ? before : undefined,
  };

  // search and author pages are always newest first; Discover is one list, without pages
  if (feed === "discover" && !search && !authorId) {
    return getDiscoverPosts(user?.id);
  }

  if (feed === "following" && !search && !authorId) {
    return user ? getFollowingPosts(user.id, page) : [];
  }

  return getPosts({ search, viewerId: user?.id, authorId, ...page });
});

export default defineEventHandler(async (event): Promise<IPostContent[]> => {
  const { q } = getQuery(event);
  const { user } = await getUserSession(event);
  return getPosts(typeof q === "string" ? q.slice(0, 100) : undefined, user?.id);
});

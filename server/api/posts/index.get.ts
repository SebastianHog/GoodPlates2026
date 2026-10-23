export default defineEventHandler(async (event): Promise<IPostContent[]> => {
  const { q, author } = getQuery(event);
  const { user } = await getUserSession(event);
  return getPosts(
    typeof q === "string" ? q.slice(0, 100) : undefined,
    user?.id,
    typeof author === "string" ? author : undefined,
  );
});

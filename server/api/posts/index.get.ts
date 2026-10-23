export default defineEventHandler((event): Promise<IPostContent[]> => {
  const { q } = getQuery(event);
  return getPosts(typeof q === "string" ? q.slice(0, 100) : undefined);
});

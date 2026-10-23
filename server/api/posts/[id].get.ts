export default defineEventHandler(async (event): Promise<IPostContent> => {
  const id = getRouterParam(event, "id")!;
  const { user } = await getUserSession(event);
  const post = await getPostById(id, user?.id);

  if (!post) {
    throw createError({ statusCode: 404, statusMessage: "Post not found" });
  }

  return post;
});

export default defineEventHandler(async (event): Promise<IPostContent> => {
  const { user } = await requireUserSession(event);
  const id = getRouterParam(event, "id")!;
  const post = await getPostById(id);

  if (!post) {
    throw createError({ statusCode: 404, statusMessage: "Post not found" });
  }
  if (post.author.id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: "You can only edit your own posts" });
  }

  const { data, errors } = validatePostInput(await readBody(event));
  if (errors) {
    throw createError({ statusCode: 400, statusMessage: Object.values(errors)[0], data: { errors } });
  }

  return (await updatePost(id, data))!;
});

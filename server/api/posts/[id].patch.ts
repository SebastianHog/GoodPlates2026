export default defineEventHandler(async (event): Promise<IPostContent> => {
  const { user } = await requireUserSession(event);

  const { data, errors } = validatePostInput(await readBody(event));
  if (errors) {
    throw createError({ statusCode: 400, statusMessage: "Invalid post", data: { errors } });
  }

  const id = getRouterParam(event, "id")!;
  const result = await updatePost(id, user.id, data);
  if (result === "missing") {
    throw createError({ statusCode: 404, statusMessage: "Post not found" });
  }
  if (result === "notYours") {
    throw createError({ statusCode: 403, statusMessage: "You can only edit your own posts" });
  }

  // Photos taken out of the post would otherwise stay in storage forever
  await deletePhotos(result.unusedImages, `post ${id}`);

  return result.post;
});

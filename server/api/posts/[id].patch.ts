export default defineEventHandler(async (event): Promise<IPostContent> => {
  const { user } = await requireUserSession(event);

  const { data, errors } = validatePostInput(await readBody(event));
  if (errors) {
    throw createError({ statusCode: 400, statusMessage: "Invalid post", data: { errors } });
  }

  // Photos must be ones this user uploaded in the last 12 hours, or already in one of their posts
  const expiredImages = await unavailableImages(data.images, user.id);
  if (expiredImages.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "Some photos have expired, add them again",
      data: { errors: { images: "validation.photosExpired" }, expiredImages },
    });
  }

  const id = getRouterParam(event, "id")!;
  const result = await updatePost(id, user.id, data);
  if (result === "missing") {
    throw createError({ statusCode: 404, statusMessage: "Post not found" });
  }
  if (result === "notYours") {
    throw createError({ statusCode: 403, statusMessage: "You can only edit your own posts" });
  }

  await claimUploads(data.images);

  // Photos taken out of the post would otherwise stay in storage forever
  await deletePhotos(result.unusedImages, `post ${id}`);

  return result.post;
});

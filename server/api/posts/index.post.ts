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

  const author = await getUserById(user.id);
  if (!author) {
    throw createError({ statusCode: 401, statusMessage: "Your account no longer exists" });
  }

  const post = await createPost(data, author);
  await claimUploads(data.images);
  return post;
});

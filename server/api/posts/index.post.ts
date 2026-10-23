export default defineEventHandler(async (event): Promise<IPostContent> => {
  const { user } = await requireUserSession(event);
  const { title, body, image } = await readBody(event);

  if (!title || !body) {
    throw createError({ statusCode: 400, statusMessage: "Title and body are required" });
  }

  // Only accept keys from /api/uploads, not arbitrary URLs
  if (image && !IMAGE_KEY_PATTERN.test(image)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid image" });
  }

  const author = await getUserById(user.id);
  if (!author) {
    throw createError({ statusCode: 401, statusMessage: "Your account no longer exists" });
  }

  return await createPost({ title, body, image: image ?? "" }, author);
});

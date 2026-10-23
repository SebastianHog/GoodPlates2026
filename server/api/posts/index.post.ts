export default defineEventHandler(async (event): Promise<IPostContent> => {
  const { title, body, image } = await readBody(event);

  if (!title || !body) {
    throw createError({ statusCode: 400, statusMessage: "Title and body are required" });
  }

  // Only accept keys from /api/uploads, not arbitrary URLs
  if (image && !IMAGE_KEY_PATTERN.test(image)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid image" });
  }

  return await createPost({ title, body, image: image ?? "" });
});

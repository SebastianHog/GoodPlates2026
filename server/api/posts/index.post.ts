export default defineEventHandler(async (event): Promise<IPostContent> => {
  const { title, body, image } = await readBody(event);

  if (!title || !body) {
    throw createError({ statusCode: 400, statusMessage: "Title and body are required" });
  }

  return await createPost({ title, body, image: image ?? "" });
});

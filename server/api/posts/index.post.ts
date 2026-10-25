export default defineEventHandler(async (event): Promise<IPostContent> => {
  const { user } = await requireUserSession(event);
  const { data, errors } = validatePostInput(await readBody(event));

  if (errors) {
    throw createError({ statusCode: 400, statusMessage: "Invalid post", data: { errors } });
  }

  // A post may only use photos this user uploaded, not keys copied from someone else's images
  if (!(await ownsUploads(user.id, data.images))) {
    throw createError({ statusCode: 403, statusMessage: "Those photos aren't yours to use" });
  }

  const author = await getUserById(user.id);
  if (!author) {
    throw createError({ statusCode: 401, statusMessage: "Your account no longer exists" });
  }

  return await createPost(data, author);
});

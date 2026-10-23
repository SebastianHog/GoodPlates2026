export default defineEventHandler(async (event): Promise<IPostContent> => {
  const { user } = await requireUserSession(event);
  const { data, errors } = validatePostInput(await readBody(event));

  if (errors) {
    throw createError({ statusCode: 400, statusMessage: Object.values(errors)[0], data: { errors } });
  }

  const author = await getUserById(user.id);
  if (!author) {
    throw createError({ statusCode: 401, statusMessage: "Your account no longer exists" });
  }

  return await createPost(data, author);
});

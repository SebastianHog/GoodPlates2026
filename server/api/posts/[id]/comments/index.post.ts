// Adds a comment to a post, or a reply to a comment with { parentId }
export default defineEventHandler(async (event): Promise<IComment> => {
  const { user } = await requireUserSession(event);
  const { data, error } = validateCommentInput(await readBody(event));

  if (!data) {
    throw createError({ statusCode: 400, statusMessage: "Invalid comment", data: { messageKey: error } });
  }

  const author = await getUserById(user.id);
  if (!author) {
    throw createError({ statusCode: 401, statusMessage: "Your account no longer exists" });
  }

  const result = await createComment(getRouterParam(event, "id")!, data, author);
  if (typeof result === "string") throw commentError(result);

  setResponseStatus(event, 201);
  return result;
});

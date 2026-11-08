// Deletes a comment (with its replies, for a top comment). The writer can, and so can the post's author
export default defineEventHandler(async (event): Promise<{ deleted: true }> => {
  const { user } = await requireUserSession(event);
  const result = await deleteComment(
    getRouterParam(event, "id")!,
    getRouterParam(event, "commentId")!,
    user.id,
  );

  if (result !== true) throw commentError(result);
  return { deleted: true };
});

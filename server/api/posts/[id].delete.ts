export default defineEventHandler(async (event): Promise<{ deleted: true }> => {
  const { user } = await requireUserSession(event);
  const id = getRouterParam(event, "id")!;
  const result = await deletePost(id, user.id);

  if (result === "missing") {
    throw createError({ statusCode: 404, statusMessage: "Post not found" });
  }
  if (result === "notYours") {
    throw createError({ statusCode: 403, statusMessage: "You can only delete your own posts" });
  }

  // The post is gone either way; a photo that fails to delete only takes up space
  await Promise.allSettled(
    result.flatMap((key) => IMAGE_WIDTHS.map((width) => deleteObject(`${key}-${width}.webp`))),
  ).then((results) => {
    const failed = results.filter((outcome) => outcome.status === "rejected").length;
    if (failed) console.warn(`Could not delete ${failed} photo files of post ${id}`);
  });

  return { deleted: true };
});

export default defineEventHandler(async (event): Promise<{ deleted: true }> => {
  const { user } = await requireUserSession(event);
  const id = getRouterParam(event, "id")!;
  const post = await getPostById(id);

  if (!post) {
    throw createError({ statusCode: 404, statusMessage: "Post not found" });
  }
  if (post.author.id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: "You can only delete your own posts" });
  }

  const unusedImages = (await deletePost(id)) ?? [];

  // The post is gone either way; a photo that fails to delete only takes up space
  await Promise.allSettled(
    unusedImages.flatMap((key) => IMAGE_WIDTHS.map((width) => deleteObject(`${key}-${width}.webp`))),
  ).then((results) => {
    const failed = results.filter((result) => result.status === "rejected").length;
    if (failed) console.warn(`Could not delete ${failed} photo files of post ${id}`);
  });

  return { deleted: true };
});

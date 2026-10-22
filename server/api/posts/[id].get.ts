export default defineEventHandler((event): IPostContent => {
  const id = getRouterParam(event, "id")!;
  const post = getPostById(id);

  if (!post) {
    throw createError({ statusCode: 404, statusMessage: "Post not found" });
  }

  return post;
});

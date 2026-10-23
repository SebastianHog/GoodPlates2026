// PUT likes, bookmarks or cooks a post (/api/posts/:id/like, /bookmark, /cook), DELETE takes it back
export default defineEventHandler(async (event): Promise<ToggleResult> => {
  const mark = getRouterParam(event, "mark");
  if (mark !== "like" && mark !== "bookmark" && mark !== "cook") {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }
  if (event.method !== "PUT" && event.method !== "DELETE") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  const { user } = await requireUserSession(event);
  const on = event.method === "PUT";
  const count = await setPostMark(mark, getRouterParam(event, "id")!, user.id, on);

  if (count === null) {
    throw createError({ statusCode: 404, statusMessage: "Post not found" });
  }

  return { on, count };
});

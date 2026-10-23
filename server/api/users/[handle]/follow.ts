// PUT follows a user, DELETE unfollows; answers with their new follower count
export default defineEventHandler(async (event): Promise<ToggleResult> => {
  if (event.method !== "PUT" && event.method !== "DELETE") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  const { user } = await requireUserSession(event);
  const followee = await getUserByHandle(getRouterParam(event, "handle")!);

  if (!followee) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }
  if (followee.id === user.id) {
    throw createError({ statusCode: 400, statusMessage: "You can't follow yourself" });
  }

  const on = event.method === "PUT";
  const count = await setFollow(user.id, followee.id, on);
  return { on, count };
});

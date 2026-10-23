export default defineEventHandler(
  async (event): Promise<{ following: boolean; followerCount: number }> => {
    const { user } = await requireUserSession(event);
    const followee = await getUserByHandle(getRouterParam(event, "handle")!);

    if (!followee) {
      throw createError({ statusCode: 404, statusMessage: "User not found" });
    }
    if (followee.id === user.id) {
      throw createError({ statusCode: 400, statusMessage: "You can't follow yourself" });
    }

    const followerCount = await setFollow(user.id, followee.id, false);
    return { following: false, followerCount };
  },
);

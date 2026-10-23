export default defineEventHandler(
  async (event): Promise<{ cooked: boolean; cookCount: number }> => {
    const { user } = await requireUserSession(event);
    const cookCount = await setPostCook(
      getRouterParam(event, "id")!,
      user.id,
      false,
    );

    if (cookCount === null) {
      throw createError({ statusCode: 404, statusMessage: "Post not found" });
    }

    return { cooked: false, cookCount };
  },
);

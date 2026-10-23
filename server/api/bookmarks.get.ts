export default defineEventHandler(async (event): Promise<IPostContent[]> => {
  const { user } = await requireUserSession(event);
  return getBookmarkedPosts(user.id);
});

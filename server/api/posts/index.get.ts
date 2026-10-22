export default defineEventHandler((): Promise<IPostContent[]> => {
  return getPosts();
});

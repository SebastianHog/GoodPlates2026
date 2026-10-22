export default defineEventHandler((): IPostContent[] => {
  return getPosts();
});

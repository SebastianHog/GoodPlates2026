import fakePosts from "~/assets/fakeData/posts.json";

export function usePosts() {
  // TODO: replace with api call once api is created
  return { data: ref(fakePosts as IPostContent[]) };
}

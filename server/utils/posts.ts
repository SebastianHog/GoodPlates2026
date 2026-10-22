import fakePosts from "../data/posts.json";

// TODO: replace with a database once one is chosen
const posts = fakePosts as IPostContent[];

export function getPosts(): IPostContent[] {
  return posts;
}

export function getPostById(id: string): IPostContent | undefined {
  return posts.find((post) => post.id === id);
}

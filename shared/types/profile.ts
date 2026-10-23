// A cook's public page: who they are, their recipes, and follow numbers
export interface IProfile {
  user: IAuthor;
  // The first page of their recipes; more come from /api/posts?author=
  posts: IPostContent[];
  postCount: number;
  followerCount: number;
  followingCount: number;
  followedByMe: boolean;
}

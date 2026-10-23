// A cook's public page: who they are, their recipes, and follow numbers
export interface IProfile {
  user: IAuthor;
  posts: IPostContent[];
  followerCount: number;
  followingCount: number;
  followedByMe: boolean;
}

export interface IPostContent {
  id: string;
  author: IAuthor;
  title: string;
  caption: string;
  // Upload keys, the first one is the cover photo
  images: string[];
  ingredients: string[];
  steps: string[];
  servings: string;
  totalTimeMinutes: number | null;
  likeCount: number;
  cookCount: number;
  likedByMe: boolean;
  bookmarkedByMe: boolean;
  cookedByMe: boolean;
  createdAt: string;
  modifiedAt: string;
}

// create and edit forms
export type PostInput = Pick<
  IPostContent,
  | "title"
  | "caption"
  | "images"
  | "ingredients"
  | "steps"
  | "servings"
  | "totalTimeMinutes"
>;

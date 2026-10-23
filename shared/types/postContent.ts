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
  // Whether the logged-in viewer has liked / bookmarked it; always false for logged-out visitors
  likedByMe: boolean;
  bookmarkedByMe: boolean;
  createdAt: string;
  modifiedAt: string;
}

// What the create and edit forms send
export type PostInput = Pick<
  IPostContent,
  "title" | "caption" | "images" | "ingredients" | "steps" | "servings" | "totalTimeMinutes"
>;

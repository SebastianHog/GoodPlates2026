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
  createdAt: string;
  modifiedAt: string;
}

// What the create and edit forms send
export type PostInput = Pick<
  IPostContent,
  "title" | "caption" | "images" | "ingredients" | "steps" | "servings" | "totalTimeMinutes"
>;

import type { IAuthor } from "./author";

export interface IPostContent {
  id: string;
  author: IAuthor;
  title: string;
  body: string;
  createdAt: string;
  modifiedAt: string;
}

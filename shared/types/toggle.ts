// What the server answers after an on/off action (like, bookmark, cook, follow)
export interface ToggleResult {
  on: boolean;
  count: number;
}

export type PostMark = "like" | "bookmark" | "cook";

// A comment on a post. Top comments have parentId null; replies point at their top comment
export interface IComment {
  id: string;
  postId: string;
  parentId: string | null;
  author: IAuthor;
  body: string;
  createdAt: string;
}

// A top comment with its replies, oldest reply first. Replies are one level deep: a reply to a reply joins the same thread
export interface ICommentThread extends IComment {
  replies: IComment[];
}

// POST /api/posts/:id/comments
export interface CommentInput {
  body: string;
  // The top comment being replied to, or null for a new top comment
  parentId: string | null;
}

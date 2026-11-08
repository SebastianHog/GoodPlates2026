// How many top comments one request returns; each comes with all its replies
export const COMMENT_PAGE_SIZE = 20;

export const COMMENT_LIMITS = {
  body: 1000,
} as const;

// Where the next page of top comments starts: "<createdAt>_<id>" of the last one shown, sent as ?before=
export function commentCursor(comment: Pick<IComment, "createdAt" | "id">): string {
  return `${comment.createdAt}_${comment.id}`;
}

// Checks a new comment, returning the cleaned input or the problem as an i18n key (translate it with COMMENT_LIMITS)
export function validateCommentInput(
  raw: unknown,
): { data: CommentInput; error: null } | { data: null; error: string } {
  const input = (raw ?? {}) as Record<string, unknown>;
  const body = typeof input.body === "string" ? input.body.trim() : "";
  const parentId = typeof input.parentId === "string" && input.parentId ? input.parentId : null;

  if (!body) return { data: null, error: "comments.validation.required" };
  if (body.length > COMMENT_LIMITS.body) return { data: null, error: "comments.validation.tooLong" };

  return { data: { body, parentId }, error: null };
}

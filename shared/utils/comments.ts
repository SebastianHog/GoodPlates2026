// How many top comments one request returns; each comes with all its replies
export const COMMENT_PAGE_SIZE = 20;

export const COMMENT_LIMITS = {
  body: 1000,
  // Keeps one thread (and so one page of comments) from growing without end
  replies: 50,
} as const;

// Where the next page of top comments starts: "<createdAt>_<id>" of the last one shown, sent as ?before=
export function commentCursor(comment: Pick<IComment, "createdAt" | "id">): string {
  return `${comment.createdAt}_${comment.id}`;
}

// Checks a new comment, returning the cleaned input or the problem as an i18n key (translate it with COMMENT_LIMITS).
// Line endings become \n and runs of blank lines shrink to one, so a comment can't push the page down with empty space
export function validateCommentInput(
  raw: unknown,
): { data: CommentInput; error: null } | { data: null; error: string } {
  const input = (raw ?? {}) as Record<string, unknown>;
  const body =
    typeof input.body === "string"
      ? input.body
          .replace(/\r\n?/g, "\n")
          .replace(/[ \t]+$/gm, "")
          .replace(/\n{3,}/g, "\n\n")
          .trim()
      : "";
  const parentId = typeof input.parentId === "string" && input.parentId ? input.parentId : null;

  if (!body) return { data: null, error: "comments.validation.required" };
  if (body.length > COMMENT_LIMITS.body) return { data: null, error: "comments.validation.tooLong" };

  return { data: { body, parentId }, error: null };
}

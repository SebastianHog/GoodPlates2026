// A page of a post's comments: top comments newest first (?before= for the next page), each with all its replies
export default defineEventHandler(async (event): Promise<ICommentThread[]> => {
  const { limit, before } = getQuery(event);
  const threads = await getCommentThreads(getRouterParam(event, "id")!, {
    limit: Math.min(Math.max(Math.floor(Number(limit)) || COMMENT_PAGE_SIZE, 1), 50),
    before: typeof before === "string" ? before : undefined,
  });

  if (!threads) throw commentError("postMissing");
  return threads;
});

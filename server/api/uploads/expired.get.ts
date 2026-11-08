// Which of these photos can no longer be posted, so a restored draft can drop them.
// GET /api/uploads/expired?keys=posts/...&keys=posts/...
export default defineEventHandler(async (event): Promise<{ expired: string[] }> => {
  const { user } = await requireUserSession(event);

  const raw = getQuery(event).keys;
  const keys = (Array.isArray(raw) ? raw : [raw])
    .filter((key): key is string => typeof key === "string" && IMAGE_KEY_PATTERN.test(key))
    .slice(0, POST_LIMITS.photos);

  return { expired: await unavailableImages(keys, user.id) };
});

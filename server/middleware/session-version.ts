// A session cookie carries the user's session version from when they logged in. Logging out raises
// the stored version, so a cookie from before then no longer matches and is cleared here before any
// handler trusts it. Only runs for API requests that already carry a session, so anonymous and image
// traffic pays nothing.
export default defineEventHandler(async (event) => {
  if (!event.path.startsWith("/api/") || isInternalRequest(event)) return;

  const { user } = await getUserSession(event);
  if (!user) return;

  const current = await getSessionVersion(user.id);
  // The account is gone, or this cookie predates a logout: drop it so the request is treated as anonymous
  if (current === null || current !== (user.sessionVersion ?? 0)) {
    await clearUserSession(event);
  }
});

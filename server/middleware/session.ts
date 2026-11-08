import type { H3Event } from "h3";

// A copy of a logged-out cookie is treated as logged out, and removed.
// Pages read the login through /api/_auth/session while rendering, so checking /api/ covers them too
export default defineEventHandler(async (event) => {
  if (!event.path.startsWith("/api/")) return;

  const session = await getUserSession(event);
  if (!session.user) return;

  if (await isSessionRevoked(session.id)) {
    await clearUserSession(event);
    forgetIncomingSession(event);
  }
});

// Clearing only tells the browser to drop the cookie; h3 would still read the old one from this request
function forgetIncomingSession(event: H3Event) {
  const name = useRuntimeConfig(event).session.name!;
  const headers = event.node.req.headers;

  delete headers[`x-${name.toLowerCase()}-session`];
  if (headers.cookie) {
    headers.cookie = headers.cookie
      .split(";")
      .filter((cookie: string) => cookie.split("=")[0]!.trim() !== name)
      .join(";");
  }
}

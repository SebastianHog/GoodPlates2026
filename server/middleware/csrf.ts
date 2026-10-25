// Stops another site from making a logged-in visitor's browser send state-changing requests
// (login CSRF, and writes once signed in). Three cheap checks, any of which rejects:
//   1. Sec-Fetch-Site: modern browsers mark cross-site/same-site requests; only same-origin is allowed.
//   2. Content-Type: a cross-site HTML form can only send form/text bodies, never JSON, so those are
//      refused on the API (uploads are the one multipart route).
//   3. Origin: when NUXT_PUBLIC_SITE_URL is set, a present Origin must match it.
// Requests without these headers (server-to-server, the activity simulator, native tools) still pass.
export default defineEventHandler((event) => {
  if (event.method === "GET" || event.method === "HEAD" || isInternalRequest(event)) return;

  const path = event.path.split("?")[0]!;
  if (!path.startsWith("/api/")) return;

  const fetchSite = getRequestHeader(event, "sec-fetch-site");
  if (fetchSite === "cross-site" || fetchSite === "same-site") {
    throw createError({ statusCode: 403, statusMessage: "Cross-site request refused" });
  }

  const contentType = getRequestHeader(event, "content-type")?.split(";")[0]?.trim().toLowerCase();
  const isUpload = path === "/api/uploads";
  if (
    contentType &&
    (contentType === "application/x-www-form-urlencoded" ||
      contentType === "text/plain" ||
      (contentType === "multipart/form-data" && !isUpload))
  ) {
    throw createError({ statusCode: 415, statusMessage: "Send this request as JSON" });
  }

  const siteUrl = useRuntimeConfig(event).public.siteUrl;
  const origin = getRequestHeader(event, "origin");
  if (siteUrl && origin && new URL(origin).origin !== new URL(siteUrl).origin) {
    throw createError({ statusCode: 403, statusMessage: "Cross-site request refused" });
  }
});

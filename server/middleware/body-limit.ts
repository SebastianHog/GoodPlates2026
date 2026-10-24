// Refuses request bodies that are too big before anything reads them into memory
const UPLOAD_MAX_BYTES = 10 * 1024 * 1024 + 64 * 1024;
// The largest valid post (caption, 30 ingredients, 20 steps) is far below this
const JSON_MAX_BYTES = 256 * 1024;

export default defineEventHandler((event) => {
  if (event.method === "GET" || event.method === "HEAD" || isInternalRequest(event)) return;

  const length = getRequestHeader(event, "content-length");
  if (length === undefined) {
    // A streamed body has no length to check up front; browsers always send one
    if (getRequestHeader(event, "transfer-encoding")) {
      throw createError({ statusCode: 411, statusMessage: "Content-Length is required" });
    }
    return;
  }

  const max = event.path.split("?")[0] === "/api/uploads" ? UPLOAD_MAX_BYTES : JSON_MAX_BYTES;
  if (Number(length) > max) {
    throw createError({ statusCode: 413, statusMessage: "Request is too large" });
  }
});

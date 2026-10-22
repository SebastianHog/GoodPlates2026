// Serves images from Garage at /images/<key> until the bucket has its own public domain
export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, "key")!;

  try {
    const object = await getObject(key);
    setResponseHeaders(event, {
      "Content-Type": object.ContentType ?? "application/octet-stream",
      "Cache-Control": object.CacheControl ?? "public, max-age=31536000, immutable",
    });
    return sendStream(event, object.Body!.transformToWebStream());
  } catch (error) {
    if ((error as Error).name === "NoSuchKey") {
      throw createError({ statusCode: 404, statusMessage: "Image not found" });
    }
    throw error;
  }
});

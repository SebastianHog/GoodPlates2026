// Serves images from Garage at /images/<key> until the bucket has its own public domain
export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, "key")!;

  // Only the resized post photos are public, never anything else that may be in the bucket
  const [, image, width] = key.match(/^(.+)-(\d+)\.webp$/) ?? [];
  if (!image || !IMAGE_KEY_PATTERN.test(image) || !IMAGE_WIDTHS.some((size) => String(size) === width)) {
    throw createError({ statusCode: 404, statusMessage: "Image not found" });
  }

  try {
    const object = await getObject(key);
    setResponseHeaders(event, {
      "Content-Type": "image/webp",
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

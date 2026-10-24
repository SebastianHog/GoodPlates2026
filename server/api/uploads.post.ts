import sharp from "sharp";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
// What sharp calls those formats once it has read the file (AVIF is a kind of HEIF)
const ACCEPTED_FORMATS = ["jpeg", "png", "webp", "heif"];
// About 50 megapixels, more than phone cameras take; bigger images would use a lot of memory to resize
const MAX_PIXELS = 50_000_000;

// Uploads one photo to Garage in every size from IMAGE_WIDTHS and returns its key
export default defineEventHandler(async (event): Promise<{ key: string }> => {
  await requireUserSession(event);
  const parts = await readMultipartFormData(event);
  const file = parts?.find((part) => part.name === "image" && part.filename);

  if (!file) {
    throw createError({
      statusCode: 400,
      statusMessage: "No image was uploaded",
    });
  }
  if (!file.type || !ACCEPTED_TYPES.includes(file.type)) {
    throw createError({
      statusCode: 415,
      statusMessage: "Use a JPG, PNG, WebP or AVIF image",
    });
  }
  if (file.data.length > MAX_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: "Image must be 10 MB or smaller",
    });
  }

  // The browser's file type is only a claim; check what the file really is before resizing it
  const metadata = await sharp(file.data)
    .metadata()
    .catch(() => null);
  if (!metadata?.format || !ACCEPTED_FORMATS.includes(metadata.format)) {
    throw createError({
      statusCode: 415,
      statusMessage: "That file could not be read as an image",
    });
  }
  if ((metadata.width ?? 0) * (metadata.height ?? 0) > MAX_PIXELS) {
    throw createError({
      statusCode: 413,
      statusMessage: "Image must be 50 megapixels or smaller",
    });
  }

  const key = `posts/${crypto.randomUUID()}`;

  let resized: Uint8Array[];
  try {
    // convert the users image to webp, as that is the standard I want to use.
    resized = await Promise.all(
      IMAGE_WIDTHS.map((width) =>
        sharp(file.data, { limitInputPixels: MAX_PIXELS })
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer(),
      ),
    );
  } catch {
    // The header was fine but the rest of the file is broken, for example cut off
    throw createError({
      statusCode: 415,
      statusMessage: "That file could not be read as an image",
    });
  }

  await Promise.all(
    resized.map((body, index) => putObject(`${key}-${IMAGE_WIDTHS[index]}.webp`, body, "image/webp")),
  );

  return { key };
});

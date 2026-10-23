import sharp from "sharp";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

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

  const key = `posts/${crypto.randomUUID()}`;

  try {
    await Promise.all(
      IMAGE_WIDTHS.map(async (width) => {
        // convert the users image to webp, as that is the standard I want to use.
        const body = await sharp(file.data)
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        await putObject(`${key}-${width}.webp`, body, "image/webp");
      }),
    );
  } catch (error) {
    if ((error as Error).message.includes("unsupported image format")) {
      throw createError({
        statusCode: 415,
        statusMessage: "That file could not be read as an image",
      });
    }
    throw error;
  }

  return { key };
});

export default defineEventHandler(async () => {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
  } catch (error) {
    // The error can name hosts and users, so it goes to the log instead of the public answer
    console.error("Health check: database", error);
    throw createError({ statusCode: 503, statusMessage: "Database is not responding..." });
  }

  try {
    await pingStorage();
  } catch (error) {
    console.error("Health check: image storage", error);
    throw createError({ statusCode: 503, statusMessage: "Image storage is not responding..." });
  }

  return { status: "ok", db: "connected", storage: "connected" };
});

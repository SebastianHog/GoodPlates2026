export default defineEventHandler(async () => {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
  } catch (error) {
    throw createError({
      statusCode: 503,
      statusMessage: "Database is not responding...",
      data: { message: (error as Error).message },
    });
  }

  try {
    await pingStorage();
  } catch (error) {
    throw createError({
      statusCode: 503,
      statusMessage: "Image storage is not responding...",
      data: { message: (error as Error).message },
    });
  }

  return { status: "ok", db: "connected", storage: "connected" };
});

export default defineEventHandler(async () => {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return { status: "ok", db: "connected" };
  } catch (error) {
    throw createError({
      statusCode: 503,
      statusMessage: "Database is not responding...",
      data: { message: (error as Error).message },
    });
  }
});

// Logging out (DELETE /api/_auth/session) remembers the cookie's id, so copies of it stop working too
export default defineNitroPlugin(() => {
  sessionHooks.hook("clear", async (_data, event) => {
    // Read before the session is cleared, while the cookie's id is still known
    const { id, user } = await getUserSession(event);
    if (id && user) {
      await revokeSession(id);
    }
  });
});

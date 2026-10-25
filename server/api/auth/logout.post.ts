// Logs the user out: bumps their session version so any copy of the current cookie stops working,
// then clears the cookie on this device. Safe to call without a session.
export default defineEventHandler(async (event): Promise<{ loggedOut: true }> => {
  const { user } = await getUserSession(event);
  if (user) {
    await clearUserSessions(user.id);
  }
  await clearUserSession(event);
  return { loggedOut: true };
});

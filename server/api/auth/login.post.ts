export default defineEventHandler(async (event): Promise<IAuthor> => {
  const { email, password } = await readBody(event);

  if (typeof email !== "string" || typeof password !== "string") {
    throw createError({ statusCode: 400, statusMessage: "Email and password are required" });
  }

  // No account has an email or password this long, and hashing a huge password would tie up the server
  const user = email.length <= 254 && password.length <= 128 ? await verifyUserLogin(email, password) : null;

  // Same answer for an unknown email and a wrong password, so accounts can't be discovered
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Wrong email or password" });
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      displayName: user.displayName,
      hiddenName: user.hiddenName,
      sessionVersion: (await getSessionVersion(user.id)) ?? 0,
    },
  });

  return user;
});

export default defineEventHandler(async (event): Promise<IAuthor> => {
  const { email, password } = await readBody(event);

  if (typeof email !== "string" || typeof password !== "string") {
    throw createError({ statusCode: 400, statusMessage: "Email and password are required" });
  }

  const user = await verifyUserLogin(email, password);

  // Same answer for an unknown email and a wrong password, so accounts can't be discovered
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Wrong email or password" });
  }

  await setUserSession(event, {
    user: { id: user.id, displayName: user.displayName, hiddenName: user.hiddenName },
  });

  return user;
});

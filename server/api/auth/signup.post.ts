const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default defineEventHandler(async (event): Promise<IAuthor> => {
  const { displayName, hiddenName, email, password } = await readBody(event);

  if (typeof displayName !== "string" || !displayName.trim() || displayName.trim().length > 40) {
    throw createError({ statusCode: 400, statusMessage: "Name must be 1–40 characters" });
  }
  if (typeof hiddenName !== "string" || !HANDLE_PATTERN.test(hiddenName)) {
    throw createError({ statusCode: 400, statusMessage: "Username must be 3–20 characters: a–z, 0–9 and _" });
  }
  if (typeof email !== "string" || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw createError({ statusCode: 400, statusMessage: "Enter a valid email address" });
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    throw createError({ statusCode: 400, statusMessage: "Password must be 8–128 characters" });
  }

  const user = await createUser({ displayName: displayName.trim(), hiddenName, email, password });
  await setUserSession(event, {
    user: { id: user.id, displayName: user.displayName, hiddenName: user.hiddenName },
  });

  return user;
});

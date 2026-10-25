import { ObjectId, type WithId } from "mongodb";

interface UserDocument extends Omit<IAuthor, "id"> {
  email: string;
  passwordHash: string;
  // Incremented on logout; the value baked into a session cookie must match for it to stay valid
  sessionVersion?: number;
}

let indexesReady = false;

async function usersCollection() {
  const db = await getDb();
  const users = db.collection<UserDocument>("users");

  // Unique indexes stop two accounts sharing an email or username, even on simultaneous sign-ups
  if (!indexesReady) {
    await Promise.all([
      users.createIndex({ email: 1 }, { unique: true }),
      users.createIndex({ hiddenName: 1 }, { unique: true }),
    ]);
    indexesReady = true;
  }

  return users;
}

// Public profile only: never send the email, password hash or session version to other users
function toAuthor({
  _id,
  email: _email,
  passwordHash: _hash,
  sessionVersion: _version,
  ...user
}: WithId<UserDocument>): IAuthor {
  return { ...user, id: _id.toHexString() };
}

// The value a session cookie must carry to stay valid; a logout raises it (see clearUserSessions)
export async function getSessionVersion(userId: string): Promise<number | null> {
  if (!ObjectId.isValid(userId)) {
    return null;
  }
  const users = await usersCollection();
  const doc = await users.findOne({ _id: new ObjectId(userId) }, { projection: { sessionVersion: 1 } });
  return doc ? (doc.sessionVersion ?? 0) : null;
}

// Logs the user out everywhere: every cookie issued before this stops matching. Returns the new version.
export async function clearUserSessions(userId: string): Promise<number> {
  const users = await usersCollection();
  const doc = await users.findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $inc: { sessionVersion: 1 } },
    { returnDocument: "after", projection: { sessionVersion: 1 } },
  );
  return doc?.sessionVersion ?? 0;
}

// Public profiles for a list of user ids, by id
export async function getUsersByIds(ids: string[]): Promise<Map<string, IAuthor>> {
  const users = await usersCollection();
  const docs = await users
    .find({ _id: { $in: ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id)) } })
    .toArray();
  return new Map(docs.map((doc) => [doc._id.toHexString(), toAuthor(doc)]));
}

// Ids of users whose name or username contains the search term
export async function findUserIds(term: string): Promise<string[]> {
  const users = await usersCollection();
  const pattern = { $regex: escapeRegex(term), $options: "i" };
  const docs = await users
    .find({ $or: [{ displayName: pattern }, { hiddenName: pattern }] })
    .project({ _id: 1 })
    .toArray();
  return docs.map((doc) => doc._id.toHexString());
}

export async function getUserById(id: string): Promise<IAuthor | null> {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const users = await usersCollection();
  const doc = await users.findOne({ _id: new ObjectId(id) });
  return doc ? toAuthor(doc) : null;
}

export async function getUserByHandle(handle: string): Promise<IAuthor | null> {
  const users = await usersCollection();
  const doc = await users.findOne({ hiddenName: handle.toLowerCase() });
  return doc ? toAuthor(doc) : null;
}

// Checked against when the email is unknown, so that answer takes as long as a wrong password
let unknownUserHash: Promise<string> | undefined;

// Returns the user only when the password matches
export async function verifyUserLogin(email: string, password: string): Promise<IAuthor | null> {
  const users = await usersCollection();
  const doc = await users.findOne({ email: email.toLowerCase() });

  if (!doc) {
    unknownUserHash ??= hashPassword(crypto.randomUUID());
    await verifyPassword(await unknownUserHash, password);
    return null;
  }

  return (await verifyPassword(doc.passwordHash, password)) ? toAuthor(doc) : null;
}

export async function createUser(input: {
  displayName: string;
  hiddenName: string;
  email: string;
  password: string;
}): Promise<IAuthor> {
  const now = new Date().toISOString();
  const user: UserDocument = {
    displayName: input.displayName,
    hiddenName: input.hiddenName,
    email: input.email.toLowerCase(),
    passwordHash: await hashPassword(input.password),
    bio: "",
    createdAt: now,
    modifiedAt: now,
  };

  const users = await usersCollection();
  try {
    const { insertedId } = await users.insertOne(user);
    return toAuthor({ _id: insertedId, ...user });
  } catch (error) {
    const duplicate = error as { code?: number; keyPattern?: Record<string, number> };
    if (duplicate.code === 11000) {
      // A clashing username is safe to name (the user picked it). A clashing email is not: a clear
      // message there would let anyone check which emails have an account, so it stays generic.
      if (duplicate.keyPattern?.hiddenName) {
        throw createError({
          statusCode: 409,
          statusMessage: "That username is already taken",
          data: { messageKey: "auth.errors.usernameTaken" },
        });
      }
      throw createError({
        statusCode: 409,
        statusMessage: "Could not create your account",
        data: { messageKey: "auth.errors.signupFailed" },
      });
    }
    throw error;
  }
}

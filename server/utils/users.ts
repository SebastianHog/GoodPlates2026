import { ObjectId, type WithId } from "mongodb";

interface UserDocument extends Omit<IAuthor, "id"> {
  email: string;
  passwordHash: string;
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

// Public profile only: never send the email or password hash to other users
function toAuthor({ _id, email: _email, passwordHash: _hash, ...user }: WithId<UserDocument>): IAuthor {
  return { ...user, id: _id.toHexString() };
}

export async function getUserById(id: string): Promise<IAuthor | null> {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const users = await usersCollection();
  const doc = await users.findOne({ _id: new ObjectId(id) });
  return doc ? toAuthor(doc) : null;
}

// Returns the user only when the password matches
export async function verifyUserLogin(email: string, password: string): Promise<IAuthor | null> {
  const users = await usersCollection();
  const doc = await users.findOne({ email: email.toLowerCase() });

  if (!doc || !(await verifyPassword(doc.passwordHash, password))) {
    return null;
  }

  return toAuthor(doc);
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
    if ((error as { code?: number }).code === 11000) {
      throw createError({ statusCode: 409, statusMessage: "That email or username is already taken" });
    }
    throw error;
  }
}

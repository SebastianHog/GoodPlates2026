// Ids of login cookies that were logged out. The cookie itself can't be changed once handed out,
// so a copy of it is only stopped by the server remembering the id
interface RevokedSessionDocument {
  _id: string;
  expiresAt: Date;
}

let indexReady = false;

async function revokedSessionsCollection() {
  const db = await getDb();
  const revoked = db.collection<RevokedSessionDocument>("revokedSessions");

  // MongoDB deletes rows on its own once expiresAt has passed
  if (!indexReady) {
    await revoked.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    indexReady = true;
  }

  return revoked;
}

export async function revokeSession(sessionId: string) {
  // Kept as long as the cookie could still be valid, after that the cookie has expired on its own
  const expiresAt = new Date(Date.now() + useRuntimeConfig().session.maxAge! * 1000);

  const revoked = await revokedSessionsCollection();
  await revoked.updateOne({ _id: sessionId }, { $set: { expiresAt } }, { upsert: true });
}

export async function isSessionRevoked(sessionId: string): Promise<boolean> {
  const revoked = await revokedSessionsCollection();
  return Boolean(await revoked.findOne({ _id: sessionId }, { projection: { _id: 1 } }));
}

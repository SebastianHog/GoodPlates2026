// Who follows who, one row per pair so a follow can only happen once
let indexesReady = false;

async function followsCollection() {
  const db = await getDb();
  const follows = db.collection<{
    followerId: string;
    followeeId: string;
    createdAt: string;
  }>("follows");
  if (!indexesReady) {
    await Promise.all([
      follows.createIndex({ followerId: 1, followeeId: 1 }, { unique: true }),
      follows.createIndex({ followeeId: 1 }),
    ]);
    indexesReady = true;
  }
  return follows;
}

export async function setFollow(
  followerId: string,
  followeeId: string,
  following: boolean,
): Promise<number> {
  const follows = await followsCollection();
  if (following) {
    await follows.updateOne(
      { followerId, followeeId },
      { $setOnInsert: { createdAt: new Date().toISOString() } },
      { upsert: true },
    );
  } else {
    await follows.deleteOne({ followerId, followeeId });
  }
  return follows.countDocuments({ followeeId });
}

export async function getFollowCounts(
  userId: string,
): Promise<{ followers: number; following: number }> {
  const follows = await followsCollection();
  const [followers, following] = await Promise.all([
    follows.countDocuments({ followeeId: userId }),
    follows.countDocuments({ followerId: userId }),
  ]);
  return { followers, following };
}

export async function isFollowing(
  followerId: string,
  followeeId: string,
): Promise<boolean> {
  const follows = await followsCollection();
  return (await follows.countDocuments({ followerId, followeeId }, { limit: 1 })) > 0;
}

export async function getFollowedIds(followerId: string): Promise<string[]> {
  const follows = await followsCollection();
  const rows = await follows.find({ followerId }).toArray();
  return rows.map((row) => row.followeeId);
}

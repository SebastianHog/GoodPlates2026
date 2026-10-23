import { ObjectId, type WithId } from "mongodb";

// Likes, bookmarks and cooks live in their own collections, one row per user and post, so each can only happen once
export type MarkKind = "likes" | "bookmarks" | "cooks";
const markIndexReady = new Set<MarkKind>();

export async function marksCollection(kind: MarkKind) {
  const db = await getDb();
  const marks = db.collection<{
    postId: string;
    userId: string;
    createdAt: string;
  }>(kind);
  if (!markIndexReady.has(kind)) {
    await marks.createIndex({ postId: 1, userId: 1 }, { unique: true });
    await marks.createIndex({ userId: 1, createdAt: -1 });
    markIndexReady.add(kind);
  }
  return marks;
}

async function markedPostIds(
  kind: MarkKind,
  userId: string,
  postIds: string[],
): Promise<Set<string>> {
  const marks = await marksCollection(kind);
  const rows = await marks.find({ userId, postId: { $in: postIds } }).toArray();
  return new Set(rows.map((row) => row.postId));
}

// Turns post documents into posts, saying for each whether the viewer liked, bookmarked and cooked it
export async function withViewerMarks(
  docs: WithId<PostDocument>[],
  viewerId?: string,
): Promise<IPostContent[]> {
  if (!viewerId) {
    return docs.map((doc) => toPost(doc));
  }

  const ids = docs.map((doc) => doc._id.toHexString());
  const [liked, bookmarked, cooked] = await Promise.all([
    markedPostIds("likes", viewerId, ids),
    markedPostIds("bookmarks", viewerId, ids),
    markedPostIds("cooks", viewerId, ids),
  ]);
  return docs.map((doc) => {
    const id = doc._id.toHexString();
    return toPost(doc, {
      liked: liked.has(id),
      bookmarked: bookmarked.has(id),
      cooked: cooked.has(id),
    });
  });
}

// Adds or removes a like/bookmark/cook row; returns whether anything changed, or null when the post is missing
async function setMark(
  kind: MarkKind,
  postId: string,
  userId: string,
  on: boolean,
): Promise<boolean | null> {
  if (!ObjectId.isValid(postId)) {
    return null;
  }

  const posts = await postsCollection();
  if (
    !(await posts.countDocuments({ _id: new ObjectId(postId) }, { limit: 1 }))
  ) {
    return null;
  }

  const marks = await marksCollection(kind);
  if (on) {
    try {
      await marks.insertOne({
        postId,
        userId,
        createdAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      if ((error as { code?: number }).code === 11000) return false;
      throw error;
    }
  }

  const { deletedCount } = await marks.deleteOne({ postId, userId });
  return deletedCount > 0;
}

// Likes, bookmarks or cooks a post (or takes it back) and returns the new count, or null when the post is missing.
// Bookmarks have no count, so they return 0. Repeating the same action changes nothing
export async function setPostMark(
  mark: PostMark,
  postId: string,
  userId: string,
  on: boolean,
): Promise<number | null> {
  if (mark === "like") return setCountedMark("likes", "likeCount", postId, userId, on);
  if (mark === "cook") return setCountedMark("cooks", "cookCount", postId, userId, on);
  return (await setMark("bookmarks", postId, userId, on)) === null ? null : 0;
}

// A mark that also keeps a count on the post
async function setCountedMark(
  kind: MarkKind,
  countField: "likeCount" | "cookCount",
  postId: string,
  userId: string,
  on: boolean,
): Promise<number | null> {
  const changed = await setMark(kind, postId, userId, on);
  if (changed === null) {
    return null;
  }

  const posts = await postsCollection();
  const _id = new ObjectId(postId);
  const doc = changed
    ? await posts.findOneAndUpdate(
        { _id },
        { $inc: { [countField]: on ? 1 : -1 } },
        { returnDocument: "after" },
      )
    : await posts.findOne({ _id });
  return doc?.[countField] ?? 0;
}

// The user's bookmarked posts, most recently bookmarked first
export async function getBookmarkedPosts(
  userId: string,
): Promise<IPostContent[]> {
  const marks = await marksCollection("bookmarks");
  const rows = await marks.find({ userId }).sort({ createdAt: -1 }).toArray();

  const posts = await postsCollection();
  const docs = await posts
    .find({ _id: { $in: rows.map((row) => new ObjectId(row.postId)) } })
    .toArray();
  const byId = new Map(docs.map((doc) => [doc._id.toHexString(), doc]));
  const ordered = rows
    .map((row) => byId.get(row.postId))
    .filter((doc) => doc !== undefined);

  return withViewerMarks(ordered, userId);
}

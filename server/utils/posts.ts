import { ObjectId, type WithId } from "mongodb";

type PostDocument = Omit<
  IPostContent,
  "id" | "likedByMe" | "bookmarkedByMe" | "cookedByMe"
>;

async function postsCollection() {
  const db = await getDb();
  return db.collection<PostDocument>("posts");
}

// What the viewer has done to a post; logged-out visitors have done none of it
interface ViewerMarks {
  liked: boolean;
  bookmarked: boolean;
  cooked: boolean;
}

function toPost(
  { _id, ...post }: WithId<PostDocument>,
  viewer: ViewerMarks = { liked: false, bookmarked: false, cooked: false },
): IPostContent {
  return {
    ...post,
    id: _id.toHexString(),
    likedByMe: viewer.liked,
    bookmarkedByMe: viewer.bookmarked,
    cookedByMe: viewer.cooked,
  };
}

// Newest first. With a search term, only posts whose title, recipe or author name contain it.
// With a viewer, each post also says whether they liked and bookmarked it
export async function getPosts(
  search?: string,
  viewerId?: string,
  authorId?: string,
): Promise<IPostContent[]> {
  const posts = await postsCollection();
  const term = search?.trim();
  const filter = {
    ...(term && {
      $or: [
        "title",
        "caption",
        "ingredients",
        "steps",
        "author.displayName",
        "author.hiddenName",
      ].map((field) => ({
        [field]: { $regex: escapeRegex(term), $options: "i" },
      })),
    }),
    ...(authorId && { "author.id": authorId }),
  };

  const docs = await posts.find(filter).sort({ createdAt: -1 }).toArray();
  return withViewerMarks(docs, viewerId);
}

// Following: posts by the people the viewer follows, newest first
export async function getFollowingPosts(
  viewerId: string,
): Promise<IPostContent[]> {
  const followedIds = await getFollowedIds(viewerId);
  if (!followedIds.length) {
    return [];
  }

  const posts = await postsCollection();
  const docs = await posts
    .find({ "author.id": { $in: followedIds } })
    .sort({ createdAt: -1 })
    .toArray();
  return withViewerMarks(docs, viewerId);
}

// Treat the search term as plain text, not as a regex pattern
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getPostById(
  id: string,
  viewerId?: string,
): Promise<IPostContent | null> {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const posts = await postsCollection();
  const doc = await posts.findOne({ _id: new ObjectId(id) });
  if (!doc) {
    return null;
  }

  const [post] = await withViewerMarks([doc], viewerId);
  return post!;
}

export async function createPost(
  input: PostInput,
  author: IAuthor,
): Promise<IPostContent> {
  const now = new Date().toISOString();
  const post: PostDocument = {
    author,
    ...input,
    likeCount: 0,
    cookCount: 0,
    createdAt: now,
    modifiedAt: now,
  };

  const posts = await postsCollection();
  const { insertedId } = await posts.insertOne(post);
  return toPost({ _id: insertedId, ...post });
}

export async function updatePost(
  id: string,
  input: PostInput,
): Promise<IPostContent | null> {
  const posts = await postsCollection();
  const doc = await posts.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...input, modifiedAt: new Date().toISOString() } },
    { returnDocument: "after" },
  );
  return doc ? toPost(doc) : null;
}

// Removes a post with its likes, bookmarks and cooks. Returns the photo keys no other post uses, or null when the post is missing
export async function deletePost(id: string): Promise<string[] | null> {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const posts = await postsCollection();
  const doc = await posts.findOneAndDelete({ _id: new ObjectId(id) });
  if (!doc) {
    return null;
  }

  await Promise.all(
    (["likes", "bookmarks", "cooks"] as const).map(async (kind) =>
      (await marksCollection(kind)).deleteMany({ postId: id }),
    ),
  );

  const images = doc.images;
  const stillUsed = await Promise.all(
    images.map((key) => posts.countDocuments({ images: key }, { limit: 1 })),
  );
  return images.filter((_, index) => !stillUsed[index]);
}

// Likes, bookmarks and cooks live in their own collections, one row per user and post, so each can only happen once
type MarkKind = "likes" | "bookmarks" | "cooks";
const markIndexReady = new Set<MarkKind>();

async function marksCollection(kind: MarkKind) {
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

async function withViewerMarks(
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

// Likes or unlikes a post and returns the new count; repeating the same action changes nothing
export function setPostLike(
  postId: string,
  userId: string,
  liked: boolean,
): Promise<number | null> {
  return setCountedMark("likes", "likeCount", postId, userId, liked);
}

// Marks a post as cooked (or not) and returns how many people cooked it
export function setPostCook(
  postId: string,
  userId: string,
  cooked: boolean,
): Promise<number | null> {
  return setCountedMark("cooks", "cookCount", postId, userId, cooked);
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

// Bookmarks or un-bookmarks a post; false when the post does not exist
export async function setPostBookmark(
  postId: string,
  userId: string,
  bookmarked: boolean,
): Promise<boolean> {
  return (await setMark("bookmarks", postId, userId, bookmarked)) !== null;
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

// Discover: posts that are popular and/or recent, slight randomness to it.
// Score = activity in the last 2 weeks (bookmarks count double, cooks triple) + all-time likes and cooks, faded by age, times a random factor.
// Posts the viewer wrote, liked, bookmarked or cooked go last, and the same author isn't shown twice in a row if it can be avoided
const DISCOVER_DAYS = 14;

export async function getDiscoverPosts(
  viewerId?: string,
): Promise<IPostContent[]> {
  const posts = await postsCollection();
  const docs = await posts.find().toArray();
  const since = new Date(Date.now() - DISCOVER_DAYS * 86_400_000).toISOString();

  const [recentLikes, recentBookmarks, recentCooks] = await Promise.all([
    recentMarkCounts("likes", since),
    recentMarkCounts("bookmarks", since),
    recentMarkCounts("cooks", since),
  ]);
  const withMarks = await withViewerMarks(docs, viewerId);

  const scored = withMarks.map((post) => {
    const activity =
      (recentLikes.get(post.id) ?? 0) +
      2 * (recentBookmarks.get(post.id) ?? 0) +
      3 * (recentCooks.get(post.id) ?? 0) +
      0.25 * post.likeCount +
      0.5 * post.cookCount;
    const ageDays =
      (Date.now() - new Date(post.createdAt).getTime()) / 86_400_000;
    const freshness = 1 / (1 + ageDays / DISCOVER_DAYS);
    const score =
      (1 + Math.log1p(activity)) * freshness * (0.5 + Math.random());
    const seen =
      post.author.id === viewerId ||
      post.likedByMe ||
      post.bookmarkedByMe ||
      post.cookedByMe;
    return { post, score, seen };
  });

  const ranked = scored
    .sort((a, b) => Number(a.seen) - Number(b.seen) || b.score - a.score)
    .map(({ post }) => post);
  return spreadAuthors(ranked);
}

// How many likes/bookmarks/cooks each post got since the given time
async function recentMarkCounts(
  kind: MarkKind,
  since: string,
): Promise<Map<string, number>> {
  const marks = await marksCollection(kind);
  const rows = await marks
    .aggregate<{
      _id: string;
      count: number;
    }>([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ])
    .toArray();
  return new Map(rows.map((row) => [row._id, row.count]));
}

// Keeps the order, but picks the next post by a different author than the previous one when there is one
function spreadAuthors(posts: IPostContent[]): IPostContent[] {
  const left = [...posts];
  const result: IPostContent[] = [];
  while (left.length) {
    const previous = result.at(-1)?.author.id;
    const index = left.findIndex((post) => post.author.id !== previous);
    result.push(...left.splice(index === -1 ? 0 : index, 1));
  }
  return result;
}

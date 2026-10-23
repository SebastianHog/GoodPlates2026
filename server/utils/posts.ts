import { ObjectId, type WithId } from "mongodb";

// Posts made before structured recipes have `image` and `body` instead
type PostDocument = Omit<IPostContent, "id" | "likedByMe" | "bookmarkedByMe"> & { image?: string; body?: string };

async function postsCollection() {
  const db = await getDb();
  return db.collection<PostDocument>("posts");
}

// What the viewer has done to a post; logged-out visitors have done neither
interface ViewerMarks {
  liked: boolean;
  bookmarked: boolean;
}

function toPost(
  { _id, image, body, ...post }: WithId<PostDocument>,
  viewer: ViewerMarks = { liked: false, bookmarked: false },
): IPostContent {
  return {
    ...post,
    likeCount: post.likeCount ?? 0,
    likedByMe: viewer.liked,
    bookmarkedByMe: viewer.bookmarked,
    id: _id.toHexString(),
    caption: post.caption ?? "",
    images: post.images ?? (image ? [image] : []),
    ingredients: post.ingredients ?? [],
    steps: post.steps ?? (body ? [body] : []),
    servings: post.servings ?? "",
    totalTimeMinutes: post.totalTimeMinutes ?? null,
  };
}

// Newest first. With a search term, only posts whose title, recipe or author name contain it.
// With a viewer, each post also says whether they liked and bookmarked it
export async function getPosts(search?: string, viewerId?: string, authorId?: string): Promise<IPostContent[]> {
  const posts = await postsCollection();
  const term = search?.trim();
  const filter = {
    ...(term && {
      $or: ["title", "caption", "ingredients", "steps", "body", "author.displayName", "author.hiddenName"].map(
        (field) => ({ [field]: { $regex: escapeRegex(term), $options: "i" } }),
      ),
    }),
    ...(authorId && { "author.id": authorId }),
  };

  const docs = await posts.find(filter).sort({ createdAt: -1 }).toArray();
  return withViewerMarks(docs, viewerId);
}

// Treat the search term as plain text, not as a regex pattern
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getPostById(id: string, viewerId?: string): Promise<IPostContent | null> {
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

export async function createPost(input: PostInput, author: IAuthor): Promise<IPostContent> {
  const now = new Date().toISOString();
  const post: PostDocument = {
    author,
    ...input,
    likeCount: 0,
    createdAt: now,
    modifiedAt: now,
  };

  const posts = await postsCollection();
  const { insertedId } = await posts.insertOne(post);
  return toPost({ _id: insertedId, ...post });
}

export async function updatePost(id: string, input: PostInput): Promise<IPostContent | null> {
  const posts = await postsCollection();
  const doc = await posts.findOneAndUpdate(
    { _id: new ObjectId(id) },
    // Drop the old single-image fields once a post is saved in the new shape
    { $set: { ...input, modifiedAt: new Date().toISOString() }, $unset: { image: "", body: "" } },
    { returnDocument: "after" },
  );
  return doc ? toPost(doc) : null;
}

// Likes and bookmarks live in their own collections, one row per user and post, so each can only happen once
type MarkKind = "likes" | "bookmarks";
const markIndexReady = new Set<MarkKind>();

async function marksCollection(kind: MarkKind) {
  const db = await getDb();
  const marks = db.collection<{ postId: string; userId: string; createdAt: string }>(kind);
  if (!markIndexReady.has(kind)) {
    await marks.createIndex({ postId: 1, userId: 1 }, { unique: true });
    await marks.createIndex({ userId: 1, createdAt: -1 });
    markIndexReady.add(kind);
  }
  return marks;
}

async function markedPostIds(kind: MarkKind, userId: string, postIds: string[]): Promise<Set<string>> {
  const marks = await marksCollection(kind);
  const rows = await marks.find({ userId, postId: { $in: postIds } }).toArray();
  return new Set(rows.map((row) => row.postId));
}

async function withViewerMarks(docs: WithId<PostDocument>[], viewerId?: string): Promise<IPostContent[]> {
  if (!viewerId) {
    return docs.map((doc) => toPost(doc));
  }

  const ids = docs.map((doc) => doc._id.toHexString());
  const [liked, bookmarked] = await Promise.all([
    markedPostIds("likes", viewerId, ids),
    markedPostIds("bookmarks", viewerId, ids),
  ]);
  return docs.map((doc) => {
    const id = doc._id.toHexString();
    return toPost(doc, { liked: liked.has(id), bookmarked: bookmarked.has(id) });
  });
}

// Adds or removes a like/bookmark row; returns whether anything changed, or null when the post is missing
async function setMark(kind: MarkKind, postId: string, userId: string, on: boolean): Promise<boolean | null> {
  if (!ObjectId.isValid(postId)) {
    return null;
  }

  const posts = await postsCollection();
  if (!(await posts.countDocuments({ _id: new ObjectId(postId) }, { limit: 1 }))) {
    return null;
  }

  const marks = await marksCollection(kind);
  if (on) {
    try {
      await marks.insertOne({ postId, userId, createdAt: new Date().toISOString() });
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
export async function setPostLike(postId: string, userId: string, liked: boolean): Promise<number | null> {
  const changed = await setMark("likes", postId, userId, liked);
  if (changed === null) {
    return null;
  }

  const posts = await postsCollection();
  const _id = new ObjectId(postId);
  const doc = changed
    ? await posts.findOneAndUpdate({ _id }, { $inc: { likeCount: liked ? 1 : -1 } }, { returnDocument: "after" })
    : await posts.findOne({ _id });
  return doc?.likeCount ?? 0;
}

// Bookmarks or un-bookmarks a post; false when the post does not exist
export async function setPostBookmark(postId: string, userId: string, bookmarked: boolean): Promise<boolean> {
  return (await setMark("bookmarks", postId, userId, bookmarked)) !== null;
}

// The user's bookmarked posts, most recently bookmarked first
export async function getBookmarkedPosts(userId: string): Promise<IPostContent[]> {
  const marks = await marksCollection("bookmarks");
  const rows = await marks.find({ userId }).sort({ createdAt: -1 }).toArray();

  const posts = await postsCollection();
  const docs = await posts.find({ _id: { $in: rows.map((row) => new ObjectId(row.postId)) } }).toArray();
  const byId = new Map(docs.map((doc) => [doc._id.toHexString(), doc]));
  const ordered = rows.map((row) => byId.get(row.postId)).filter((doc) => doc !== undefined);

  return withViewerMarks(ordered, userId);
}

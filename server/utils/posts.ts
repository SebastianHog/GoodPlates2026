import { ObjectId, type WithId } from "mongodb";

// Posts made before structured recipes have `image` and `body` instead
type PostDocument = Omit<IPostContent, "id" | "likedByMe"> & { image?: string; body?: string };

async function postsCollection() {
  const db = await getDb();
  return db.collection<PostDocument>("posts");
}

function toPost({ _id, image, body, ...post }: WithId<PostDocument>, likedByMe = false): IPostContent {
  return {
    ...post,
    likeCount: post.likeCount ?? 0,
    likedByMe,
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
// With a viewer, each post also says whether they liked it
export async function getPosts(search?: string, viewerId?: string): Promise<IPostContent[]> {
  const posts = await postsCollection();
  const term = search?.trim();
  const filter = term
    ? {
        $or: ["title", "caption", "ingredients", "steps", "body", "author.displayName", "author.hiddenName"].map(
          (field) => ({ [field]: { $regex: escapeRegex(term), $options: "i" } }),
        ),
      }
    : {};

  const docs = await posts.find(filter).sort({ createdAt: -1 }).toArray();
  const liked = viewerId ? await likedPostIds(viewerId, docs.map((doc) => doc._id.toHexString())) : new Set();
  return docs.map((doc) => toPost(doc, liked.has(doc._id.toHexString())));
}

// Treat the search term as plain text, not as a regex pattern
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getPostById(id: string): Promise<IPostContent | null> {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const posts = await postsCollection();
  const doc = await posts.findOne({ _id: new ObjectId(id) });
  return doc ? toPost(doc) : null;
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

// Likes live in their own collection, one row per user and post, so a user can only like once
let likeIndexReady = false;

async function likesCollection() {
  const db = await getDb();
  const likes = db.collection<{ postId: string; userId: string; createdAt: string }>("likes");
  if (!likeIndexReady) {
    await likes.createIndex({ postId: 1, userId: 1 }, { unique: true });
    likeIndexReady = true;
  }
  return likes;
}

async function likedPostIds(userId: string, postIds: string[]): Promise<Set<string>> {
  const likes = await likesCollection();
  const rows = await likes.find({ userId, postId: { $in: postIds } }).toArray();
  return new Set(rows.map((row) => row.postId));
}

// Likes or unlikes a post and returns the new count; repeating the same action changes nothing
export async function setPostLike(postId: string, userId: string, liked: boolean): Promise<number | null> {
  if (!ObjectId.isValid(postId)) {
    return null;
  }

  const posts = await postsCollection();
  const _id = new ObjectId(postId);
  if (!(await posts.countDocuments({ _id }, { limit: 1 }))) {
    return null;
  }

  const likes = await likesCollection();
  let change = 0;

  if (liked) {
    try {
      await likes.insertOne({ postId, userId, createdAt: new Date().toISOString() });
      change = 1;
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
    }
  } else {
    const { deletedCount } = await likes.deleteOne({ postId, userId });
    change = -deletedCount;
  }

  const doc = change
    ? await posts.findOneAndUpdate({ _id }, { $inc: { likeCount: change } }, { returnDocument: "after" })
    : await posts.findOne({ _id });
  return doc?.likeCount ?? 0;
}

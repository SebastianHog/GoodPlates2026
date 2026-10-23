import { ObjectId, type WithId } from "mongodb";

export type PostDocument = Omit<
  IPostContent,
  "id" | "likedByMe" | "bookmarkedByMe" | "cookedByMe"
>;

export async function postsCollection() {
  const db = await getDb();
  return db.collection<PostDocument>("posts");
}

// What the viewer has done to a post; logged-out visitors have done none of it
export interface ViewerMarks {
  liked: boolean;
  bookmarked: boolean;
  cooked: boolean;
}

export function toPost(
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

import { ObjectId, type WithId } from "mongodb";

// Posts store only the author's id; the author is looked up when reading, so name changes show everywhere.
// Older posts also have a copy of the author from when they were posted, used if the user is gone
export type PostDocument = Omit<
  IPostContent,
  "id" | "author" | "likedByMe" | "bookmarkedByMe" | "cookedByMe"
> & { author: { id: string } & Partial<IAuthor> };

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

const NO_MARKS: ViewerMarks = { liked: false, bookmarked: false, cooked: false };

export function toPost(
  { _id, ...post }: WithId<PostDocument>,
  author: IAuthor,
  viewer: ViewerMarks = NO_MARKS,
): IPostContent {
  return {
    ...post,
    id: _id.toHexString(),
    author,
    likedByMe: viewer.liked,
    bookmarkedByMe: viewer.bookmarked,
    cookedByMe: viewer.cooked,
  };
}

// Post documents to posts: with their current author, and with a viewer, whether they liked, bookmarked and cooked each
export async function toPosts(
  docs: WithId<PostDocument>[],
  viewerId?: string,
): Promise<IPostContent[]> {
  const [authors, marksFor] = await Promise.all([
    getUsersByIds([...new Set(docs.map((doc) => doc.author.id))]),
    viewerId
      ? getViewerMarks(docs.map((doc) => doc._id.toHexString()), viewerId)
      : () => NO_MARKS,
  ]);
  return docs.map((doc) =>
    toPost(doc, authors.get(doc.author.id) ?? missingAuthor(doc.author), marksFor(doc._id.toHexString())),
  );
}

// A deleted user: the copy stored on older posts, or just a placeholder
function missingAuthor(stored: PostDocument["author"]): IAuthor {
  return {
    displayName: "?",
    hiddenName: "",
    bio: "",
    createdAt: "",
    modifiedAt: "",
    ...stored,
  };
}

// Newest first. With a search term, only posts whose title, recipe or author name contain it.
// With a viewer, each post also says whether they liked, bookmarked and cooked it
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
        ...["title", "caption", "ingredients", "steps"].map((field) => ({
          [field]: { $regex: escapeRegex(term), $options: "i" },
        })),
        { "author.id": { $in: await findUserIds(term) } },
      ],
    }),
    ...(authorId && { "author.id": authorId }),
  };

  const docs = await posts.find(filter).sort({ createdAt: -1 }).toArray();
  return toPosts(docs, viewerId);
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
  return toPosts(docs, viewerId);
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

  const [post] = await toPosts([doc], viewerId);
  return post!;
}

export async function createPost(
  input: PostInput,
  author: IAuthor,
): Promise<IPostContent> {
  const now = new Date().toISOString();
  const post: PostDocument = {
    author: { id: author.id },
    ...input,
    likeCount: 0,
    cookCount: 0,
    createdAt: now,
    modifiedAt: now,
  };

  const posts = await postsCollection();
  const { insertedId } = await posts.insertOne(post);
  return toPost({ _id: insertedId, ...post }, author);
}

// Why a post couldn't be changed by the user who asked
export type NotOwnPost = "missing" | "notYours";

async function whyNotOwn(id: string): Promise<NotOwnPost> {
  if (!ObjectId.isValid(id)) {
    return "missing";
  }
  const posts = await postsCollection();
  const exists = await posts.countDocuments({ _id: new ObjectId(id) }, { limit: 1 });
  return exists ? "notYours" : "missing";
}

// Saves an edit, only when `authorId` wrote the post
export async function updatePost(
  id: string,
  authorId: string,
  input: PostInput,
): Promise<IPostContent | NotOwnPost> {
  if (!ObjectId.isValid(id)) {
    return "missing";
  }

  const posts = await postsCollection();
  const doc = await posts.findOneAndUpdate(
    { _id: new ObjectId(id), "author.id": authorId },
    { $set: { ...input, modifiedAt: new Date().toISOString() } },
    { returnDocument: "after" },
  );
  if (!doc) {
    return whyNotOwn(id);
  }

  const [post] = await toPosts([doc]);
  return post!;
}

// Removes a post with its likes, bookmarks and cooks, only when `authorId` wrote it.
// Returns the photo keys no other post uses
export async function deletePost(
  id: string,
  authorId: string,
): Promise<string[] | NotOwnPost> {
  if (!ObjectId.isValid(id)) {
    return "missing";
  }

  const posts = await postsCollection();
  const doc = await posts.findOneAndDelete({ _id: new ObjectId(id), "author.id": authorId });
  if (!doc) {
    return whyNotOwn(id);
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

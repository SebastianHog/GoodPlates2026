import { ObjectId, type WithId } from "mongodb";

type PostDocument = Omit<IPostContent, "id">;

async function postsCollection() {
  const db = await getDb();
  return db.collection<PostDocument>("posts");
}

function toPost({ _id, ...post }: WithId<PostDocument>): IPostContent {
  return { ...post, id: _id.toHexString() };
}

// Newest first. With a search term, only posts whose title, recipe or author name contain it
export async function getPosts(search?: string): Promise<IPostContent[]> {
  const posts = await postsCollection();
  const term = search?.trim();
  const filter = term
    ? {
        $or: ["title", "body", "author.displayName", "author.hiddenName"].map((field) => ({
          [field]: { $regex: escapeRegex(term), $options: "i" },
        })),
      }
    : {};

  const docs = await posts.find(filter).sort({ createdAt: -1 }).toArray();
  return docs.map(toPost);
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

// TODO: use the logged in user once auth exists
const placeholderAuthor: IAuthor = {
  id: "tempuser",
  hiddenName: "tempuser",
  displayName: "tempuser",
  email: "",
  bio: "",
  createdAt: "2026-01-01T00:00:00Z",
  modifiedAt: "2026-01-01T00:00:00Z",
};

export async function createPost(
  input: Pick<IPostContent, "title" | "body" | "image">,
): Promise<IPostContent> {
  const now = new Date().toISOString();
  const post: PostDocument = {
    author: placeholderAuthor,
    ...input,
    createdAt: now,
    modifiedAt: now,
  };

  const posts = await postsCollection();
  const { insertedId } = await posts.insertOne(post);
  return toPost({ _id: insertedId, ...post });
}

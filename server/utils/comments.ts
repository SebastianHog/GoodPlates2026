import { ObjectId, type WithId } from "mongodb";

// Comments store only the author's id; the author is looked up when reading, so name changes show everywhere.
// Replies point at their top comment with parentId, and only ever one level deep
interface CommentDocument {
  postId: string;
  parentId: string | null;
  authorId: string;
  body: string;
  createdAt: string;
}

let indexesReady = false;

async function commentsCollection() {
  const db = await getDb();
  const comments = db.collection<CommentDocument>("comments");
  if (!indexesReady) {
    await Promise.all([
      // A post's top comments, newest first (parentId null), and a thread's replies, oldest first
      comments.createIndex({ postId: 1, parentId: 1, createdAt: -1, _id: -1 }),
      comments.createIndex({ parentId: 1, createdAt: 1, _id: 1 }),
    ]);
    indexesReady = true;
  }
  return comments;
}

// Why a comment couldn't be added or removed
export type CommentProblem = "postMissing" | "commentMissing" | "notYours" | "threadFull";

async function postAuthorId(postId: string): Promise<string | null> {
  if (!ObjectId.isValid(postId)) return null;
  const posts = await postsCollection();
  const post = await posts.findOne({ _id: new ObjectId(postId) }, { projection: { "author.id": 1 } });
  return post?.author.id ?? null;
}

function toComment({ _id, authorId, ...doc }: WithId<CommentDocument>, author: IAuthor): IComment {
  return { ...doc, id: _id.toHexString(), author };
}

// A deleted user still shows as someone, without a profile link
function missingAuthor(id: string): IAuthor {
  return { id, displayName: "?", hiddenName: "", bio: "", createdAt: "", modifiedAt: "" };
}

// A page of a post's top comments, newest first, each with its replies oldest first; null when the post is missing
export async function getCommentThreads(
  postId: string,
  { limit = COMMENT_PAGE_SIZE, before }: PageOptions = {},
): Promise<ICommentThread[] | null> {
  if (!(await postAuthorId(postId))) return null;

  const comments = await commentsCollection();
  const tops = await comments
    .find({ $and: [{ postId, parentId: null }, afterCursor(before)] })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .toArray();
  if (!tops.length) return [];

  const replies = await comments
    .find({ parentId: { $in: tops.map((top) => top._id.toHexString()) } })
    .sort({ createdAt: 1, _id: 1 })
    .toArray();

  const authors = await getUsersByIds([...new Set([...tops, ...replies].map((doc) => doc.authorId))]);
  const authorOf = (doc: CommentDocument) => authors.get(doc.authorId) ?? missingAuthor(doc.authorId);

  const repliesByParent = Map.groupBy(replies, (reply) => reply.parentId!);
  return tops.map((top) => ({
    ...toComment(top, authorOf(top)),
    replies: (repliesByParent.get(top._id.toHexString()) ?? []).map((reply) => toComment(reply, authorOf(reply))),
  }));
}

// Adds a comment, or a reply when `input.parentId` is set. Replying to a reply joins the same thread
export async function createComment(
  postId: string,
  input: CommentInput,
  author: IAuthor,
): Promise<IComment | CommentProblem> {
  if (!(await postAuthorId(postId))) return "postMissing";

  const comments = await commentsCollection();
  let parentId: string | null = null;

  if (input.parentId) {
    if (!ObjectId.isValid(input.parentId)) return "commentMissing";
    const parent = await comments.findOne({ _id: new ObjectId(input.parentId), postId });
    if (!parent) return "commentMissing";
    parentId = parent.parentId ?? parent._id.toHexString();

    // Two replies at the same moment can both pass this; a thread a reply or two over the limit does no harm
    const replyCount = await comments.countDocuments({ parentId }, { limit: COMMENT_LIMITS.replies });
    if (replyCount >= COMMENT_LIMITS.replies) return "threadFull";
  }

  const doc: CommentDocument = {
    postId,
    parentId,
    authorId: author.id,
    body: input.body,
    createdAt: new Date().toISOString(),
  };
  const { insertedId } = await comments.insertOne(doc);

  // The top comment may have been deleted while this reply was saved; don't leave a reply nobody can see
  if (parentId && !(await comments.countDocuments({ _id: new ObjectId(parentId) }, { limit: 1 }))) {
    await comments.deleteOne({ _id: insertedId });
    return "commentMissing";
  }

  return toComment({ _id: insertedId, ...doc }, author);
}

// Removes a comment, and a top comment's replies with it. Allowed for whoever wrote it and for the post's author
export async function deleteComment(
  postId: string,
  commentId: string,
  userId: string,
): Promise<true | CommentProblem> {
  const ownerId = await postAuthorId(postId);
  if (!ownerId) return "postMissing";
  if (!ObjectId.isValid(commentId)) return "commentMissing";

  const comments = await commentsCollection();
  const _id = new ObjectId(commentId);
  const comment = await comments.findOne({ _id, postId });
  if (!comment) return "commentMissing";
  if (comment.authorId !== userId && ownerId !== userId) return "notYours";

  await comments.deleteOne({ _id });
  if (comment.parentId === null) {
    await comments.deleteMany({ parentId: commentId });
  }
  return true;
}

// Every comment on a post, when the post itself is deleted
export async function deletePostComments(postId: string): Promise<void> {
  const comments = await commentsCollection();
  await comments.deleteMany({ postId });
}

// The HTTP error for each problem, with the i18n key the page shows
export function commentError(problem: CommentProblem) {
  const errors = {
    postMissing: { statusCode: 404, statusMessage: "Post not found" },
    commentMissing: { statusCode: 404, statusMessage: "Comment not found" },
    notYours: { statusCode: 403, statusMessage: "You can only delete your own comments, or comments on your posts" },
    threadFull: { statusCode: 409, statusMessage: "This thread has reached the most replies it can have" },
  } as const;
  return createError({ ...errors[problem], data: { messageKey: `comments.errors.${problem}` } });
}

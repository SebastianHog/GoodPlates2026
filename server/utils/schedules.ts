import { ObjectId, type WithId } from "mongodb";

interface ScheduleDocument {
  ownerId: string;
  name: string;
  description: string;
  isPublic: boolean;
  days: ScheduleDay[];
  // A copy remembers what it was saved from, and when
  source?: { scheduleId: string; savedAt: string };
  createdAt: string;
  modifiedAt: string;
}

let indexesReady = false;

async function schedulesCollection() {
  const db = await getDb();
  const schedules = db.collection<ScheduleDocument>("schedules");
  if (!indexesReady) {
    await Promise.all([
      schedules.createIndex({ ownerId: 1, createdAt: -1 }),
      schedules.createIndex({ isPublic: 1, createdAt: -1, _id: -1 }),
      schedules.createIndex({ ownerId: 1, "source.scheduleId": 1 }),
    ]);
    indexesReady = true;
  }
  return schedules;
}

// Why a schedule couldn't be changed or saved
export type ScheduleProblem = "missing" | "notYours" | "limit" | "notBookmarked" | "ownSchedule";

function objectId(id: string): ObjectId | null {
  return ObjectId.isValid(id) && /^[0-9a-f]{24}$/.test(id) ? new ObjectId(id) : null;
}

// Lists

async function toSummaries(docs: WithId<ScheduleDocument>[]): Promise<IScheduleSummary[]> {
  // Cover photos come from the first recipes of each schedule, looked up together
  const firstIds = docs.map((doc) => schedulePostIds(doc.days).slice(0, 8));
  const ids = [...new Set(firstIds.flat())].map((id) => objectId(id)).filter((id) => id !== null);

  const posts = await postsCollection();
  const [owners, postDocs] = await Promise.all([
    getUsersByIds([...new Set(docs.map((doc) => doc.ownerId))]),
    posts.find({ _id: { $in: ids } }).project<{ _id: ObjectId; images: string[] }>({ images: 1 }).toArray(),
  ]);
  const covers = new Map(postDocs.map((doc) => [doc._id.toHexString(), doc.images[0]]));

  return docs.map((doc, index) => ({
    id: doc._id.toHexString(),
    name: doc.name,
    description: doc.description,
    isPublic: doc.isPublic,
    owner: owners.get(doc.ownerId) ?? deletedOwner(doc.ownerId),
    dayCount: doc.days.length,
    recipeCount: schedulePostIds(doc.days).length,
    coverImages: firstIds[index]!
      .map((id) => covers.get(id))
      .filter((key): key is string => Boolean(key))
      .slice(0, 3),
    savedFrom: doc.source ? { id: doc.source.scheduleId } : null,
    createdAt: doc.createdAt,
    modifiedAt: doc.modifiedAt,
  }));
}

function deletedOwner(id: string): IAuthor {
  return { id, displayName: "?", hiddenName: "", bio: "", createdAt: "", modifiedAt: "" };
}

// Public schedules from everyone, or from one author, newest first, a page at a time
export async function getPublicSchedules(
  { ownerId, limit = POST_PAGE_SIZE, before }: PageOptions & { ownerId?: string },
): Promise<IScheduleSummary[]> {
  const schedules = await schedulesCollection();
  const docs = await schedules
    .find({ $and: [{ isPublic: true, ...(ownerId && { ownerId }) }, afterCursor(before)] })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .toArray();
  return toSummaries(docs);
}

// Everything the user made or saved, private ones too
export async function getOwnSchedules(userId: string): Promise<IScheduleSummary[]> {
  const schedules = await schedulesCollection();
  const docs = await schedules.find({ ownerId: userId }).sort({ createdAt: -1 }).toArray();
  return toSummaries(docs);
}

// One schedule

// The whole schedule with its recipes, or null when it doesn't exist or is private to someone else
export async function getSchedule(id: string, viewerId?: string): Promise<ISchedule | null> {
  const _id = objectId(id);
  if (!_id) return null;

  const schedules = await schedulesCollection();
  const doc = await schedules.findOne({ _id });
  if (!doc || (!doc.isPublic && doc.ownerId !== viewerId)) return null;

  const postIds = schedulePostIds(doc.days).map((postId) => objectId(postId)).filter((postId) => postId !== null);
  const posts = await postsCollection();
  const [[summary], postList, source, myCopy] = await Promise.all([
    toSummaries([doc]),
    posts.find({ _id: { $in: postIds } }).toArray().then((docs) => toPosts(docs, viewerId)),
    doc.source ? getSource(doc.source, viewerId) : null,
    viewerId && viewerId !== doc.ownerId
      ? schedules.findOne({ ownerId: viewerId, "source.scheduleId": id }, { projection: { _id: 1 } })
      : null,
  ]);

  return {
    ...summary!,
    days: doc.days,
    posts: Object.fromEntries(postList.map((post) => [post.id, post])),
    source,
    mySavedCopyId: myCopy?._id.toHexString() ?? null,
  };
}

async function getSource(
  { scheduleId, savedAt }: NonNullable<ScheduleDocument["source"]>,
  viewerId?: string,
): Promise<IScheduleSource> {
  const _id = objectId(scheduleId);
  const schedules = await schedulesCollection();
  const original = _id ? await schedules.findOne({ _id }) : null;

  if (!original || (!original.isPublic && original.ownerId !== viewerId)) {
    return { id: scheduleId, name: null, owner: null, changedSinceSave: false };
  }

  const owner = (await getUsersByIds([original.ownerId])).get(original.ownerId);
  return {
    id: scheduleId,
    name: original.name,
    owner: owner ? { displayName: owner.displayName, hiddenName: owner.hiddenName } : null,
    changedSinceSave: original.modifiedAt > savedAt,
  };
}

// Changes

async function countOwned(userId: string): Promise<number> {
  const schedules = await schedulesCollection();
  return schedules.countDocuments({ ownerId: userId });
}

// Only bookmarked recipes can be put in a schedule
async function allBookmarked(userId: string, postIds: string[]): Promise<boolean> {
  if (postIds.length === 0) return true;
  const marks = await marksCollection("bookmarks");
  const count = await marks.countDocuments({ userId, postId: { $in: postIds } });
  return count === postIds.length;
}

export async function createSchedule(
  userId: string,
  input: ScheduleInput,
): Promise<{ id: string } | ScheduleProblem> {
  if ((await countOwned(userId)) >= SCHEDULE_LIMITS.perUser) return "limit";
  if (!(await allBookmarked(userId, schedulePostIds(input.days)))) return "notBookmarked";

  const now = new Date().toISOString();
  const schedules = await schedulesCollection();
  const { insertedId } = await schedules.insertOne({ ownerId: userId, ...input, createdAt: now, modifiedAt: now });
  return { id: insertedId.toHexString() };
}

// Recipes already in the schedule can stay (a saved copy may hold recipes the user never bookmarked); new ones must be bookmarked
export async function updateSchedule(
  id: string,
  userId: string,
  input: ScheduleInput,
): Promise<{ id: string } | ScheduleProblem> {
  const _id = objectId(id);
  if (!_id) return "missing";

  const schedules = await schedulesCollection();
  const doc = await schedules.findOne({ _id });
  if (!doc) return "missing";
  if (doc.ownerId !== userId) return "notYours";

  const existing = new Set(schedulePostIds(doc.days));
  const added = schedulePostIds(input.days).filter((postId) => !existing.has(postId));
  if (!(await allBookmarked(userId, added))) return "notBookmarked";

  await schedules.updateOne({ _id, ownerId: userId }, { $set: { ...input, modifiedAt: new Date().toISOString() } });
  return { id };
}

export async function deleteSchedule(id: string, userId: string): Promise<true | ScheduleProblem> {
  const _id = objectId(id);
  if (!_id) return "missing";

  const schedules = await schedulesCollection();
  const { deletedCount } = await schedules.deleteOne({ _id, ownerId: userId });
  if (deletedCount) return true;
  return (await schedules.countDocuments({ _id }, { limit: 1 })) ? "notYours" : "missing";
}

// Saves a private copy of someone else's public schedule. The recipes are not bookmarked.
// Saving the same schedule again returns the copy already saved
export async function saveScheduleCopy(id: string, userId: string): Promise<{ id: string } | ScheduleProblem> {
  const _id = objectId(id);
  if (!_id) return "missing";

  const schedules = await schedulesCollection();
  const original = await schedules.findOne({ _id });
  if (!original || !original.isPublic) return "missing";
  if (original.ownerId === userId) return "ownSchedule";

  const existing = await schedules.findOne({ ownerId: userId, "source.scheduleId": id }, { projection: { _id: 1 } });
  if (existing) return { id: existing._id.toHexString() };

  if ((await countOwned(userId)) >= SCHEDULE_LIMITS.perUser) return "limit";

  const now = new Date().toISOString();
  const { insertedId } = await schedules.insertOne({
    ownerId: userId,
    name: original.name,
    description: original.description,
    isPublic: false,
    days: original.days,
    source: { scheduleId: id, savedAt: now },
    createdAt: now,
    modifiedAt: now,
  });
  return { id: insertedId.toHexString() };
}

// The HTTP error for a problem, with an i18n key the page can show
export function scheduleProblemError(problem: ScheduleProblem) {
  const errors: Record<ScheduleProblem, [number, string, string]> = {
    missing: [404, "Schedule not found", "schedules.errors.notFound"],
    notYours: [403, "You can only change your own schedules", "schedules.errors.notYours"],
    limit: [409, `You can have at most ${SCHEDULE_LIMITS.perUser} schedules`, "schedules.errors.limit"],
    notBookmarked: [400, "Only bookmarked recipes can be added", "schedules.errors.notBookmarked"],
    ownSchedule: [400, "This is already your schedule", "schedules.errors.ownSchedule"],
  };
  const [statusCode, statusMessage, messageKey] = errors[problem];
  return createError({ statusCode, statusMessage, data: { messageKey } });
}

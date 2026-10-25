// Every uploaded photo is recorded with who uploaded it and when, so a post can only use its own
// uploader's photos, and photos that never end up in a post can be cleaned up later.
interface UploadDocument {
  key: string;
  ownerId: string;
  createdAt: string;
}

// How long an uploaded-but-unused photo is kept before a later upload by the same user sweeps it
const ORPHAN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

let indexesReady = false;

async function uploadsCollection() {
  const db = await getDb();
  const uploads = db.collection<UploadDocument>("uploads");
  if (!indexesReady) {
    await Promise.all([
      uploads.createIndex({ key: 1 }, { unique: true }),
      uploads.createIndex({ ownerId: 1, createdAt: 1 }),
    ]);
    indexesReady = true;
  }
  return uploads;
}

// Records a freshly uploaded photo against its uploader
export async function recordUpload(key: string, ownerId: string): Promise<void> {
  const uploads = await uploadsCollection();
  await uploads.insertOne({ key, ownerId, createdAt: new Date().toISOString() });
}

// True only when every key was uploaded by this user. Keys with no upload record (e.g. from older
// posts made before this collection existed) are allowed only when that user already uses them.
export async function ownsUploads(ownerId: string, keys: string[]): Promise<boolean> {
  if (keys.length === 0) return true;
  const uploads = await uploadsCollection();
  const owned = await uploads.find({ key: { $in: keys }, ownerId }).toArray();
  const ownedKeys = new Set(owned.map((doc) => doc.key));

  const unknown = keys.filter((key) => !ownedKeys.has(key));
  if (unknown.length === 0) return true;

  // No upload record: accept only keys the user already has in one of their own posts
  const known = await uploads.countDocuments({ key: { $in: unknown } });
  if (known > 0) return false;

  const posts = await postsCollection();
  const mine = await posts.countDocuments({ "author.id": ownerId, images: { $all: unknown } });
  return mine > 0;
}

// Opportunistic cleanup: delete this user's day-old uploads that no post uses, from storage and record.
// Runs on upload so no background scheduler is needed on the single home-server instance.
export async function sweepOrphanUploads(ownerId: string): Promise<void> {
  const uploads = await uploadsCollection();
  const cutoff = new Date(Date.now() - ORPHAN_MAX_AGE_MS).toISOString();
  const stale = await uploads.find({ ownerId, createdAt: { $lt: cutoff } }).toArray();
  if (stale.length === 0) return;

  const posts = await postsCollection();
  const orphans: string[] = [];
  for (const upload of stale) {
    const used = await posts.countDocuments({ images: upload.key }, { limit: 1 });
    if (!used) orphans.push(upload.key);
  }
  if (orphans.length === 0) return;

  await deletePhotos(orphans, `orphaned uploads of user ${ownerId}`);
  await uploads.deleteMany({ key: { $in: orphans } });
}

// Forgets the upload records for keys that have been deleted from storage with their post
export async function forgetUploads(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const uploads = await uploadsCollection();
  await uploads.deleteMany({ key: { $in: keys } });
}

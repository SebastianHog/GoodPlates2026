// Photos uploaded for a post that isn't published yet. A row is removed once a post uses the photo;
// photos still here after UPLOAD_LIFETIME_MS are deleted from storage
interface PendingUploadDocument {
  _id: string;
  userId: string;
  uploadedAt: Date;
}

const HOUR = 60 * 60 * 1000;
const hoursToDelete = 12;
export const UPLOAD_LIFETIME_MS = hoursToDelete * HOUR;
// Cleanup waits a little longer than publishing allows, so a post being published right at the limit keeps its photos
const CLEANUP_GRACE_MS = 10 * 60 * 1000;

let indexReady = false;

async function pendingUploadsCollection() {
  const db = await getDb();
  const uploads = db.collection<PendingUploadDocument>("pendingUploads");
  if (!indexReady) {
    await uploads.createIndex({ uploadedAt: 1 });
    indexReady = true;
  }
  return uploads;
}

export async function recordUpload(key: string, userId: string) {
  const uploads = await pendingUploadsCollection();
  await uploads.insertOne({ _id: key, userId, uploadedAt: new Date() });
}

// The keys this user can't put in a post: not uploaded by them in the last 12 hours, and not already in one of their posts
export async function unavailableImages(
  keys: string[],
  userId: string,
): Promise<string[]> {
  if (keys.length === 0) return [];

  const uploads = await pendingUploadsCollection();
  const posts = await postsCollection();
  const [pending, published] = await Promise.all([
    uploads
      .find({
        _id: { $in: keys },
        userId,
        uploadedAt: { $gt: new Date(Date.now() - UPLOAD_LIFETIME_MS) },
      })
      .project<{ _id: string }>({ _id: 1 })
      .toArray(),
    posts.distinct("images", { "author.id": userId, images: { $in: keys } }),
  ]);

  const available = new Set([...pending.map((doc) => doc._id), ...published]);
  return keys.filter((key) => !available.has(key));
}

// The photos are in a post now, so cleanup leaves them alone
export async function claimUploads(keys: string[]) {
  if (keys.length === 0) return;
  const uploads = await pendingUploadsCollection();
  await uploads.deleteMany({ _id: { $in: keys } });
}

// Deletes photos that were uploaded but never published
export async function deleteExpiredUploads() {
  const uploads = await pendingUploadsCollection();
  const posts = await postsCollection();
  const cutoff = new Date(Date.now() - UPLOAD_LIFETIME_MS - CLEANUP_GRACE_MS);

  for (;;) {
    // One at a time, so two servers cleaning up at once never handle the same photo
    const doc = await uploads.findOneAndDelete({ uploadedAt: { $lt: cutoff } });
    if (!doc) return;

    // A post that was saved just before its row could be removed still owns the photo
    if (!(await posts.countDocuments({ images: doc._id }, { limit: 1 }))) {
      await deletePhotos([doc._id], "an unpublished upload");
    }
  }
}

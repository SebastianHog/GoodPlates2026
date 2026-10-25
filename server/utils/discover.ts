import { ObjectId } from "mongodb";

// Discover: posts that are popular and/or recent, slight randomness to it.
// Score = activity in the last 2 weeks (bookmarks count double, cooks triple) + all-time likes and cooks, faded by age, times a random factor.
// Posts the viewer wrote, liked, bookmarked or cooked go last, and the same author isn't shown twice in a row if it can be avoided
// Only posts from the last POOL_DAYS, or with activity in the last DISCOVER_DAYS, are considered
const DISCOVER_DAYS = 14;
const POOL_DAYS = 90;
// Score at most this many recent posts per request, plus any older ones with recent activity,
// so the work stays bounded as the catalogue grows
const POOL_CAP = 300;

export async function getDiscoverPosts(
  viewerId?: string,
  limit = DISCOVER_SIZE,
): Promise<IPostContent[]> {
  const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();
  const since = daysAgo(DISCOVER_DAYS);

  const [recentLikes, recentBookmarks, recentCooks] = await Promise.all([
    recentMarkCounts("likes", since),
    recentMarkCounts("bookmarks", since),
    recentMarkCounts("cooks", since),
  ]);
  const active = [...new Set([...recentLikes.keys(), ...recentBookmarks.keys(), ...recentCooks.keys()])];

  const posts = await postsCollection();
  const activeIds = active.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
  const [recent, activeDocs] = await Promise.all([
    posts
      .find({ createdAt: { $gte: daysAgo(POOL_DAYS) } })
      .sort({ createdAt: -1, _id: -1 })
      .limit(POOL_CAP)
      .toArray(),
    activeIds.length ? posts.find({ _id: { $in: activeIds } }).toArray() : [],
  ]);
  // The newest POOL_CAP posts, plus older ones that have recent activity, with no post counted twice
  const byId = new Map(recent.map((doc) => [doc._id.toHexString(), doc]));
  for (const doc of activeDocs) byId.set(doc._id.toHexString(), doc);
  const withMarks = await toPosts([...byId.values()], viewerId);

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
  return spreadAuthors(ranked).slice(0, limit);
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

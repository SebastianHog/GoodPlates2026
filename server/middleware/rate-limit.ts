import type { H3Event } from "h3";

const MINUTE = 60_000;

// Per client IP. The first rule that matches a request counts it.
// Generous enough for a classroom or office sharing one IP, low enough to stop scripted guessing and flooding
const RULES: {
  name: string;
  max: number;
  windowMs: number;
  matches: (event: H3Event, path: string) => boolean;
}[] = [
  {
    name: "login",
    max: 20,
    windowMs: 15 * MINUTE,
    matches: (event, path) =>
      event.method === "POST" && path === "/api/auth/login",
  },
  {
    name: "signup",
    max: 10,
    windowMs: 60 * MINUTE,
    matches: (event, path) =>
      event.method === "POST" && path === "/api/auth/signup",
  },
  // A post has up to 6 photos, and failed uploads get retried
  {
    name: "upload",
    max: 60,
    windowMs: 60 * MINUTE,
    matches: (event, path) =>
      event.method === "POST" && path === "/api/uploads",
  },
  {
    name: "post",
    max: 20,
    windowMs: 60 * MINUTE,
    matches: (event, path) => event.method === "POST" && path === "/api/posts",
  },
  {
    name: "write",
    max: 120,
    windowMs: MINUTE,
    matches: (event, path) =>
      event.method !== "GET" &&
      event.method !== "HEAD" &&
      path.startsWith("/api/"),
  },
  // Search and Discover scan many posts per request
  {
    name: "search",
    max: 60,
    windowMs: MINUTE,
    matches: (event, path) => {
      if (path !== "/api/posts") return false;
      const { q, feed } = getQuery(event);
      return Boolean(q) || feed === "discover";
    },
  },
  {
    name: "read",
    max: 600,
    windowMs: MINUTE,
    matches: (_event, path) => path.startsWith("/api/"),
  },
  // A feed page shows a photo per post, and every photo is cached by the browser after the first load
  {
    name: "images",
    max: 1200,
    windowMs: MINUTE,
    matches: (_event, path) => path.startsWith("/images/"),
  },
];

export default defineEventHandler((event) => {
  // Kept for the API requests this page makes to the server while it renders
  const ip = getClientIp(event);
  event.context.clientIp = ip;

  // Calls the server makes on its own (not for a visitor) have nobody to limit
  if (!ip) return;

  const path = event.path.split("?")[0]!;
  const rule = RULES.find((candidate) => candidate.matches(event, path));
  if (!rule) return;

  const retryAfter = hitRateLimit(
    `${rule.name}:${ip}`,
    rule.max,
    rule.windowMs,
  );
  if (retryAfter !== null) {
    setResponseHeader(event, "Retry-After", retryAfter);
    throw createError({
      statusCode: 429,
      statusMessage: "Too many requests, try again later",
      data: { messageKey: "errors.tooManyRequests" },
    });
  }
});

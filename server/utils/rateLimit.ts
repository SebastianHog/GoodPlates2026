import type { H3Event } from "h3";

// Counts requests per client in fixed time windows, in memory: one app instance, and counts reset on restart
interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();
let nextSweep = 0;

// Adds one request to `key`; returns how many seconds to wait when it went over `max`, otherwise null
export function hitRateLimit(key: string, max: number, windowMs: number): number | null {
  const now = Date.now();
  if (now >= nextSweep) {
    for (const [oldKey, window] of windows) {
      if (window.resetAt <= now) windows.delete(oldKey);
    }
    nextSweep = now + 60_000;
  }

  let window = windows.get(key);
  if (!window || window.resetAt <= now) {
    window = { count: 0, resetAt: now + windowMs };
    windows.set(key, window);
  }

  window.count++;
  return window.count > max ? Math.ceil((window.resetAt - now) / 1000) : null;
}

// Requests the server makes to itself while rendering a page (useFetch during SSR) carry the page request's context
type InternalRequest = { __unenv__?: { clientIp?: string } };

export function isInternalRequest(event: H3Event): boolean {
  return "__unenv__" in event.node.req;
}

// Who sent the request. X-Forwarded-For is only believed when the connection comes from a private or local address
// (the reverse proxy); the last entry is the one that proxy added, earlier ones can be made up by the client.
// IPv6 clients are grouped by their /64, which one household or server usually has to itself
export function getClientIp(event: H3Event): string | undefined {
  if (isInternalRequest(event)) {
    return (event.node.req as InternalRequest).__unenv__?.clientIp;
  }

  let ip = normalizeIp(event.node.req.socket.remoteAddress ?? "");
  const forwarded = normalizeIp(getRequestHeader(event, "x-forwarded-for")?.split(",").at(-1)?.trim() ?? "");
  // Only believe the forwarded address from a source we trust. When NUXT_TRUSTED_PROXY_IPS lists the
  // reverse proxy, only that address counts; otherwise fall back to trusting any private/loopback source.
  // No address at all is a local socket, which only a proxy on the same machine can use.
  const trusted = useRuntimeConfig(event).trustedProxyIps
    .split(",")
    .map((entry) => normalizeIp(entry.trim()))
    .filter(Boolean);
  const fromProxy = !ip || (trusted.length ? trusted.includes(ip) : isPrivateIp(ip));
  if (forwarded && fromProxy) {
    ip = forwarded;
  }
  if (!ip) return undefined;

  return ip.includes(":") ? `${ip.split(":").slice(0, 4).join(":")}::/64` : ip;
}

// The address in one spelling (IPv6 with all eight groups, IPv4-mapped IPv6 as plain IPv4), or "" when it isn't one
function normalizeIp(ip: string): string {
  const v4 = ip.match(/^(?:::ffff:)?(\d{1,3}(?:\.\d{1,3}){3})$/i)?.[1];
  if (v4) {
    return v4.split(".").every((part) => Number(part) <= 255) ? v4 : "";
  }

  const halves = ip.toLowerCase().split("::");
  if (halves.length > 2) return "";
  const [left, right] = halves.map((half) => (half ? half.split(":") : []));
  const missing = 8 - left!.length - (right?.length ?? 0);
  if (right ? missing < 1 : missing !== 0) return "";

  const groups = [...left!, ...Array(right ? missing : 0).fill("0"), ...(right ?? [])];
  if (!groups.every((group) => /^[0-9a-f]{1,4}$/.test(group))) return "";
  return groups.map((group) => group.replace(/^0+(?=.)/, "")).join(":");
}

function isPrivateIp(ip: string): boolean {
  if (!ip.includes(":")) {
    const [a = 0, b = 0] = ip.split(".").map(Number);
    return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  // Loopback, unique local (fc00::/7) and link-local (fe80::/10)
  return ip === "0:0:0:0:0:0:0:1" || /^f[cd][0-9a-f]{2}:/.test(ip) || /^fe[89ab][0-9a-f]:/.test(ip);
}

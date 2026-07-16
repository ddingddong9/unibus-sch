import { Context } from "npm:hono";
import { db } from "../db.tsx";

type Bucket = {
  count: number;
  resetAt: number;
};

const fallbackBuckets = new Map<string, Bucket>();
let didWarnAboutRpc = false;

const hashKey = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const getRequestIdentity = (c: Context) => {
  const forwardedFor = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
  return c.req.header("cf-connecting-ip")
    || c.req.header("x-real-ip")
    || forwardedFor
    || "unknown-client";
};

const consumeFallbackBucket = (key: string, limit: number, windowSeconds: number) => {
  const now = Date.now();
  const current = fallbackBuckets.get(key);

  if (!current || current.resetAt <= now) {
    fallbackBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }

  current.count += 1;
  if (fallbackBuckets.size > 2_000) {
    for (const [bucketKey, bucket] of fallbackBuckets) {
      if (bucket.resetAt <= now) fallbackBuckets.delete(bucketKey);
    }
  }

  return current.count <= limit;
};

export const enforceRateLimit = async (
  c: Context,
  action: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
) => {
  const key = await hashKey(`${action}:${identifier}`);
  const { data, error } = await db.rpc("consume_api_rate_limit", {
    p_rate_key: key,
    p_max_requests: limit,
    p_window_seconds: windowSeconds,
  });

  let allowed: boolean;
  if (!error && typeof data === "boolean") {
    allowed = data;
  } else {
    if (!didWarnAboutRpc) {
      console.warn("Rate-limit RPC unavailable; using an instance-local fallback", error?.message);
      didWarnAboutRpc = true;
    }
    allowed = consumeFallbackBucket(key, limit, windowSeconds);
  }

  if (allowed) return null;

  c.header("Retry-After", String(windowSeconds));
  return c.json({ success: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." }, 429);
};

export const clearRateLimit = async (action: string, identifier: string) => {
  const key = await hashKey(`${action}:${identifier}`);
  fallbackBuckets.delete(key);
  const { error } = await db.from("api_rate_limits").delete().eq("rate_key", key);
  if (error && !didWarnAboutRpc) {
    console.warn("Failed to clear the persistent rate-limit bucket", error.message);
  }
};

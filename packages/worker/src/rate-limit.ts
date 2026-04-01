import type { Env } from "./types.js";

const DAILY_LIMIT = 100;

/**
 * Rate limiting: 100 attestations per public key per UTC calendar day.
 * Uses a KV key like "ratelimit:<pubkey>:<YYYY-MM-DD>" with a counter.
 */
export async function checkRateLimit(env: Env, pubkey: string): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const key = `ratelimit:${pubkey}:${today}`;

  const current = await env.ATTESTATIONS.get(key);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: DAILY_LIMIT - count - 1 };
}

/**
 * Increment rate limit counter for a public key.
 * Expires at midnight UTC (set TTL to end of day).
 */
export async function incrementRateLimit(env: Env, pubkey: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const key = `ratelimit:${pubkey}:${today}`;

  const current = await env.ATTESTATIONS.get(key);
  const count = current ? parseInt(current, 10) : 0;

  // TTL: seconds until end of UTC day
  const now = new Date();
  const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const ttl = Math.ceil((endOfDay.getTime() - now.getTime()) / 1000);

  await env.ATTESTATIONS.put(key, String(count + 1), { expirationTtl: ttl });
}

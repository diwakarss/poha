import type { Env } from "./types.js";

/**
 * Rate limiting via Durable Objects for atomic counters.
 * Each public key maps to a single DO instance, ensuring no race conditions.
 */

/**
 * Atomically check and increment the rate limit in a single DO call.
 * If allowed, the counter is already incremented when this returns.
 */
export async function checkAndIncrementRateLimit(
  env: Env,
  pubkey: string
): Promise<{ allowed: boolean; remaining: number }> {
  const id = env.RATE_LIMITER.idFromName(pubkey);
  const stub = env.RATE_LIMITER.get(id);
  const res = await stub.fetch(new Request("https://do/check-and-increment", { method: "POST" }));
  return res.json() as Promise<{ allowed: boolean; remaining: number }>;
}


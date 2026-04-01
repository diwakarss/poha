import type { Env } from "./types.js";

/**
 * Rate limiting via Durable Objects for atomic counters.
 * Each public key maps to a single DO instance, ensuring no race conditions.
 */

export async function checkRateLimit(env: Env, pubkey: string): Promise<{ allowed: boolean; remaining: number }> {
  const id = env.RATE_LIMITER.idFromName(pubkey);
  const stub = env.RATE_LIMITER.get(id);
  const res = await stub.fetch(new Request("https://do/check", { method: "POST" }));
  return res.json() as Promise<{ allowed: boolean; remaining: number }>;
}

export async function incrementRateLimit(env: Env, pubkey: string): Promise<void> {
  const id = env.RATE_LIMITER.idFromName(pubkey);
  const stub = env.RATE_LIMITER.get(id);
  await stub.fetch(new Request("https://do/increment", { method: "POST" }));
}

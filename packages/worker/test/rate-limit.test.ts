import { describe, expect, test, beforeEach } from "bun:test";
import { checkRateLimit, incrementRateLimit } from "../src/rate-limit.js";
import type { Env } from "../src/types.js";

/** In-memory KV mock */
function createMockKV(): KVNamespace {
  const store = new Map<string, { value: string; expiration?: number }>();
  return {
    get: async (key: string) => store.get(key)?.value ?? null,
    put: async (key: string, value: string, opts?: { expirationTtl?: number }) => {
      store.set(key, { value, expiration: opts?.expirationTtl });
    },
    delete: async (key: string) => { store.delete(key); },
    list: async () => ({ keys: [], list_complete: true, cacheStatus: null }),
    getWithMetadata: async () => ({ value: null, metadata: null, cacheStatus: null }),
  } as unknown as KVNamespace;
}

describe("rate-limit", () => {
  let env: Env;

  beforeEach(() => {
    env = { ATTESTATIONS: createMockKV() };
  });

  test("allows first request for a pubkey", async () => {
    const result = await checkRateLimit(env, "ed25519:abc123");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99);
  });

  test("tracks remaining count after increments", async () => {
    const pubkey = "ed25519:abc123";

    // Increment 5 times
    for (let i = 0; i < 5; i++) {
      await incrementRateLimit(env, pubkey);
    }

    const result = await checkRateLimit(env, pubkey);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(94); // 100 - 5 - 1 (current request)
  });

  test("blocks after 100 requests", async () => {
    const pubkey = "ed25519:abc123";

    // Simulate 100 increments
    for (let i = 0; i < 100; i++) {
      await incrementRateLimit(env, pubkey);
    }

    const result = await checkRateLimit(env, pubkey);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  test("different pubkeys have independent limits", async () => {
    const pubkey1 = "ed25519:key1";
    const pubkey2 = "ed25519:key2";

    // Max out key1
    for (let i = 0; i < 100; i++) {
      await incrementRateLimit(env, pubkey1);
    }

    // key2 should still be allowed
    const result1 = await checkRateLimit(env, pubkey1);
    const result2 = await checkRateLimit(env, pubkey2);

    expect(result1.allowed).toBe(false);
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(99);
  });

  test("increment sets expiration TTL", async () => {
    const pubkey = "ed25519:abc123";
    let capturedTtl: number | undefined;

    // Spy on put to capture TTL
    const originalPut = env.ATTESTATIONS.put.bind(env.ATTESTATIONS);
    env.ATTESTATIONS.put = async (key: string, value: string, opts?: any) => {
      capturedTtl = opts?.expirationTtl;
      return originalPut(key, value, opts);
    };

    await incrementRateLimit(env, pubkey);

    expect(capturedTtl).toBeDefined();
    expect(capturedTtl!).toBeGreaterThan(0);
    expect(capturedTtl!).toBeLessThanOrEqual(86400); // max 24 hours
  });
});

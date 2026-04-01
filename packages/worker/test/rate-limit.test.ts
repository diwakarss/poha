import { describe, expect, test, beforeEach } from "bun:test";
import { RateLimiterDO } from "../src/rate-limiter-do.js";

/** In-memory DurableObjectState mock */
function createMockState(): DurableObjectState {
  const store = new Map<string, unknown>();
  return {
    storage: {
      get: async (key: string) => store.get(key) ?? undefined,
      put: async (key: string, value: unknown) => { store.set(key, value); },
      delete: async (key: string) => store.delete(key),
      list: async () => store,
    },
    id: { toString: () => "test-id" },
    waitUntil: () => {},
  } as unknown as DurableObjectState;
}

function makeReq(path: string): Request {
  return new Request(`https://do${path}`, { method: "POST" });
}

describe("RateLimiterDO", () => {
  let limiter: RateLimiterDO;

  beforeEach(() => {
    limiter = new RateLimiterDO(createMockState());
  });

  test("allows first request", async () => {
    const res = await limiter.fetch(makeReq("/check"));
    const body = await res.json() as any;
    expect(body.allowed).toBe(true);
    expect(body.remaining).toBe(99);
  });

  test("tracks count after increments", async () => {
    for (let i = 0; i < 5; i++) {
      await limiter.fetch(makeReq("/increment"));
    }
    const res = await limiter.fetch(makeReq("/check"));
    const body = await res.json() as any;
    expect(body.allowed).toBe(true);
    expect(body.remaining).toBe(94); // 100 - 5 - 1
  });

  test("blocks after 100 increments", async () => {
    for (let i = 0; i < 100; i++) {
      await limiter.fetch(makeReq("/increment"));
    }
    const res = await limiter.fetch(makeReq("/check"));
    const body = await res.json() as any;
    expect(body.allowed).toBe(false);
    expect(body.remaining).toBe(0);
  });

  test("increment returns count info", async () => {
    const res = await limiter.fetch(makeReq("/increment"));
    const body = await res.json() as any;
    expect(body.count).toBe(1);
    expect(body.allowed).toBe(true);
    expect(body.remaining).toBe(99);
  });

  test("separate DO instances have independent limits", async () => {
    const limiter2 = new RateLimiterDO(createMockState());

    // Max out limiter1
    for (let i = 0; i < 100; i++) {
      await limiter.fetch(makeReq("/increment"));
    }

    // limiter2 should still be allowed
    const res1 = await limiter.fetch(makeReq("/check"));
    const body1 = await res1.json() as any;
    expect(body1.allowed).toBe(false);

    const res2 = await limiter2.fetch(makeReq("/check"));
    const body2 = await res2.json() as any;
    expect(body2.allowed).toBe(true);
  });

  test("unknown path returns 400", async () => {
    const res = await limiter.fetch(makeReq("/unknown"));
    expect(res.status).toBe(400);
  });
});

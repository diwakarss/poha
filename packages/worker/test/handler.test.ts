import { describe, expect, test, beforeEach } from "bun:test";
import worker from "../src/index.js";
import type { Env, StoredAttestation } from "../src/types.js";
import { buildAttestation } from "@poha/sdk";
import * as ed from "@noble/ed25519";
import { bytesToHex } from "@poha/sdk";

/** In-memory KV mock */
function createMockKV(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string, _opts?: any) => {
      store.set(key, value);
    },
    delete: async (key: string) => { store.delete(key); },
    list: async () => ({ keys: [], list_complete: true, cacheStatus: null }),
    getWithMetadata: async () => ({ value: null, metadata: null, cacheStatus: null }),
  } as unknown as KVNamespace;
}

/** Mock DurableObjectNamespace for rate limiting */
function createMockRateLimiter(): DurableObjectNamespace {
  return {
    idFromName: (_name: string) => ({ toString: () => "mock-id" }),
    get: (_id: any) => ({
      fetch: async (_req: Request) => Response.json({ allowed: true, remaining: 99 }),
    }),
    newUniqueId: () => ({ toString: () => "mock-id" }),
    jurisdiction: () => ({} as any),
  } as unknown as DurableObjectNamespace;
}

function makeRequest(path: string, opts?: RequestInit & { origin?: string }): Request {
  const headers = new Headers(opts?.headers);
  if (opts?.origin) headers.set("Origin", opts.origin);
  return new Request(`https://api.poha.dev${path}`, { ...opts, headers });
}

describe("worker handler", () => {
  let env: Env;

  beforeEach(() => {
    env = { ATTESTATIONS: createMockKV(), RATE_LIMITER: createMockRateLimiter() };
  });

  // --- Routing ---

  test("GET / returns health check", async () => {
    const res = await worker.fetch(makeRequest("/"), env);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.service).toBe("poha-worker");
    expect(body.status).toBe("ok");
  });

  test("unknown route returns 404", async () => {
    const res = await worker.fetch(makeRequest("/unknown"), env);
    expect(res.status).toBe(404);
  });

  test("OPTIONS returns CORS preflight", async () => {
    const res = await worker.fetch(makeRequest("/attest", { method: "OPTIONS" }), env);
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
  });

  // --- CORS ---

  test("CORS allows poha.dev origin", async () => {
    const res = await worker.fetch(
      makeRequest("/", { origin: "https://poha.dev" }),
      env
    );
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull(); // health check doesn't set CORS
  });

  test("CORS on OPTIONS reflects allowed origin", async () => {
    const res = await worker.fetch(
      makeRequest("/attest", { method: "OPTIONS", origin: "https://poha.dev" }),
      env
    );
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://poha.dev");
  });

  test("CORS on OPTIONS defaults for unknown origin", async () => {
    const res = await worker.fetch(
      makeRequest("/attest", { method: "OPTIONS", origin: "https://evil.com" }),
      env
    );
    // Should default to first allowed origin, not reflect evil.com
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://poha.dev");
  });

  // --- POST /attest ---

  test("POST /attest with invalid JSON returns 400", async () => {
    const res = await worker.fetch(
      makeRequest("/attest", {
        method: "POST",
        body: "not json",
        headers: { "Content-Type": "application/json" },
      }),
      env
    );
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error).toBe("invalid JSON body");
  });

  test("POST /attest with invalid attestation returns 400", async () => {
    const res = await worker.fetch(
      makeRequest("/attest", {
        method: "POST",
        body: JSON.stringify({ poha_version: "999" }),
        headers: { "Content-Type": "application/json" },
      }),
      env
    );
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error).toBeDefined();
  });

  // --- GET /v/:id ---

  test("GET /v/:id returns 404 for missing badge", async () => {
    const res = await worker.fetch(makeRequest("/v/aBcDe"), env);
    expect(res.status).toBe(404);
    expect(res.headers.get("Content-Type")).toContain("text/html");
  });

  test("GET /v/:id returns verification page for existing badge", async () => {
    const stored: StoredAttestation = {
      attestation: {
        poha_version: "0.1",
        content_hash: "sha256:" + "a".repeat(64),
        effort_score: 0.82,
        effort_band: "high",
        composition_duration_ms: 45000,
        input_method: "web_keyboard",
        final_text_length: 100,
        timestamp_hour: new Date().toISOString(),
        signer_pubkey: "ed25519:" + "b".repeat(64),
        signature: "ed25519:" + "c".repeat(128),
      },
      created_at: new Date().toISOString(),
      short_id: "aBcDe",
    };
    await env.ATTESTATIONS.put("att:aBcDe", JSON.stringify(stored));

    const res = await worker.fetch(makeRequest("/v/aBcDe"), env);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/html");
    const html = await res.text();
    expect(html).toContain("aBcDe");
    expect(html).toContain("Typed by hand");
  });

  // --- GET /api/:id ---

  test("GET /api/:id returns 404 for missing badge", async () => {
    const res = await worker.fetch(makeRequest("/api/xYzWq"), env);
    expect(res.status).toBe(404);
  });

  test("GET /api/:id returns JSON for existing badge", async () => {
    const stored: StoredAttestation = {
      attestation: {
        poha_version: "0.1",
        content_hash: "sha256:" + "a".repeat(64),
        effort_score: 0.55,
        effort_band: "moderate",
        composition_duration_ms: 30000,
        input_method: "web_keyboard",
        final_text_length: 50,
        timestamp_hour: new Date().toISOString(),
        signer_pubkey: "ed25519:" + "b".repeat(64),
        signature: "ed25519:" + "c".repeat(128),
      },
      created_at: new Date().toISOString(),
      short_id: "xYzWq",
    };
    await env.ATTESTATIONS.put("att:xYzWq", JSON.stringify(stored));

    const res = await worker.fetch(makeRequest("/api/xYzWq"), env);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.short_id).toBe("xYzWq");
    expect(body.attestation.effort_band).toBe("moderate");
  });

  // --- Collision retry exhaustion ---

  test("POST /attest returns 500 when all short ID retries collide", async () => {
    // KV that always returns existing data on get (simulates full collision)
    const alwaysCollideKV = {
      get: async (_key: string) => "existing",
      put: async () => {},
      delete: async () => {},
      list: async () => ({ keys: [], list_complete: true, cacheStatus: null }),
      getWithMetadata: async () => ({ value: null, metadata: null, cacheStatus: null }),
    } as unknown as KVNamespace;
    const collisionEnv: Env = { ATTESTATIONS: alwaysCollideKV, RATE_LIMITER: env.RATE_LIMITER };

    // Build a valid signed attestation to pass validation
    const privKey = ed.utils.randomPrivateKey();
    const pubKey = await ed.getPublicKeyAsync(privKey);
    const pubHex = bytesToHex(pubKey);
    const att = await buildAttestation({
      messageText: "collision test",
      effortScore: 0.82,
      effortBand: "high",
      compositionDurationMs: 45000,
      inputMethod: "web_keyboard",
      finalTextLength: 14,
      signerPubkey: `ed25519:${pubHex}`,
      signer: (bytes) => ed.signAsync(bytes, privKey),
    });

    const res = await worker.fetch(
      makeRequest("/attest", {
        method: "POST",
        body: JSON.stringify(att),
        headers: { "Content-Type": "application/json" },
      }),
      collisionEnv
    );
    expect(res.status).toBe(500);
    const body = await res.json() as any;
    expect(body.error).toContain("unique ID");
  });

  // --- Route pattern validation ---

  test("short ID must be exactly 5 alphanumeric chars", async () => {
    // Too short
    const res1 = await worker.fetch(makeRequest("/v/aBc"), env);
    expect(res1.status).toBe(404);

    // Too long
    const res2 = await worker.fetch(makeRequest("/v/aBcDeF"), env);
    expect(res2.status).toBe(404);

    // Special chars
    const res3 = await worker.fetch(makeRequest("/v/ab-de"), env);
    expect(res3.status).toBe(404);
  });
});

import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { submitAttestation } from "../src/api.js";

describe("api client", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("returns parsed response on success", async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({
        short_id: "aBcDe",
        verify_url: "/v/aBcDe",
        remaining_today: 98,
      }), { status: 201 });

    const result = await submitAttestation({ test: true });
    expect(result.short_id).toBe("aBcDe");
    expect(result.verify_url).toBe("/v/aBcDe");
    expect(result.remaining_today).toBe(98);
  });

  test("throws on network failure", async () => {
    globalThis.fetch = async () => { throw new TypeError("Failed to fetch"); };

    await expect(submitAttestation({ test: true })).rejects.toThrow(
      "Could not connect to server"
    );
  });

  test("throws with server error message on 400", async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: "invalid content_hash format" }), { status: 400 });

    await expect(submitAttestation({ test: true })).rejects.toThrow(
      "invalid content_hash format"
    );
  });

  test("throws with HTTP status on non-JSON error", async () => {
    globalThis.fetch = async () =>
      new Response("Internal Server Error", { status: 500 });

    await expect(submitAttestation({ test: true })).rejects.toThrow("HTTP 500");
  });

  test("throws on 429 rate limit", async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: "rate limit exceeded (100/day per key)" }), {
        status: 429,
        headers: { "Retry-After": "86400" },
      });

    await expect(submitAttestation({ test: true })).rejects.toThrow("rate limit exceeded");
  });
});

import { describe, expect, test } from "bun:test";
import { validateAttestation } from "../src/validate.js";
import * as ed from "@noble/ed25519";

/** Helper: build a valid attestation with real signature */
async function makeSignedAttestation(overrides: Record<string, unknown> = {}) {
  const privkey = ed.utils.randomPrivateKey();
  const pubkey = await ed.getPublicKeyAsync(privkey);
  const pubkeyHex = Buffer.from(pubkey).toString("hex");

  // Round current time to hour
  const now = new Date();
  now.setMinutes(0, 0, 0);

  const base: Record<string, unknown> = {
    poha_version: "0.1",
    content_hash: "sha256:" + "a".repeat(64),
    effort_score: 0.82,
    effort_band: "high",
    composition_duration_ms: 45000,
    input_method: "web_keyboard",
    final_text_length: 100,
    timestamp_hour: now.toISOString(),
    signer_pubkey: `ed25519:${pubkeyHex}`,
    ...overrides,
  };

  // Canonical JSON of unsigned attestation
  const unsigned = { ...base };
  const json = JSON.stringify(unsigned, (_k, v) => {
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      const s: Record<string, unknown> = {};
      for (const k of Object.keys(v as Record<string, unknown>).sort()) {
        s[k] = (v as Record<string, unknown>)[k];
      }
      return s;
    }
    return v;
  });

  const sigBytes = await ed.signAsync(new TextEncoder().encode(json), privkey);
  const sigHex = Buffer.from(sigBytes).toString("hex");

  return {
    ...base,
    signature: `ed25519:${sigHex}`,
  } as any;
}

describe("validateAttestation", () => {
  test("accepts a valid signed attestation", async () => {
    const att = await makeSignedAttestation();
    const result = await validateAttestation(att);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test("rejects unsupported version", async () => {
    const att = await makeSignedAttestation({ poha_version: "0.2" });
    const result = await validateAttestation(att);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("unsupported version");
  });

  test("rejects invalid content_hash format", async () => {
    const att = await makeSignedAttestation({ content_hash: "md5:abc" });
    const result = await validateAttestation(att);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("content_hash");
  });

  test("rejects effort_score out of range", async () => {
    const att = await makeSignedAttestation({ effort_score: 1.5 });
    const result = await validateAttestation(att);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("effort_score");
  });

  test("rejects score/band inconsistency", async () => {
    // Score 0.82 should be "high", not "low"
    const att = await makeSignedAttestation({ effort_band: "low" });
    const result = await validateAttestation(att);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("inconsistent");
  });

  test("rejects invalid input_method", async () => {
    const att = await makeSignedAttestation({ input_method: "telepathy" });
    const result = await validateAttestation(att);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("input_method");
  });

  test("rejects non-hour-rounded timestamp", async () => {
    const att = await makeSignedAttestation({ timestamp_hour: "2026-04-01T14:30:00.000Z" });
    const result = await validateAttestation(att);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("rounded to the hour");
  });

  test("rejects expired timestamp (older than 24h)", async () => {
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000);
    old.setMinutes(0, 0, 0);
    const att = await makeSignedAttestation({ timestamp_hour: old.toISOString() });
    const result = await validateAttestation(att);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("older than 24 hours");
  });

  test("rejects invalid signature format", async () => {
    const att = await makeSignedAttestation();
    att.signature = "rsa:abc123";
    const result = await validateAttestation(att);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("signature format");
  });

  test("rejects tampered attestation (wrong signature)", async () => {
    const att = await makeSignedAttestation();
    // Tamper with the effort score after signing
    att.effort_score = 0.95;
    att.effort_band = "high"; // keep band consistent
    const result = await validateAttestation(att);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("signature verification");
  });

  test("rejects missing required fields", async () => {
    const att = await makeSignedAttestation();
    att.content_hash = "";
    const result = await validateAttestation(att);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("required fields");
  });

  test("rejects negative composition_duration_ms", async () => {
    const att = await makeSignedAttestation({ composition_duration_ms: -1 });
    const result = await validateAttestation(att);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("composition_duration_ms");
  });
});

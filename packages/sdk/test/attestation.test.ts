import { describe, expect, test } from "bun:test";
import { buildAttestation } from "../src/attestation.js";
import { canonicalJSON, toUTF8Bytes } from "../src/canonical.js";
import type { Signer } from "../src/types.js";

// Mock signer that returns a deterministic "signature"
const mockSigner: Signer = async (bytes: Uint8Array) => {
  // Return first 64 bytes of input (padded) as fake signature
  const sig = new Uint8Array(64);
  sig.set(bytes.slice(0, Math.min(64, bytes.length)));
  return sig;
};

describe("buildAttestation", () => {
  test("produces valid attestation with all fields", async () => {
    const att = await buildAttestation({
      messageText: "Hello, this is a test message",
      effortScore: 0.823,
      effortBand: "high",
      compositionDurationMs: 45000,
      inputMethod: "web_keyboard",
      finalTextLength: 29,
      signerPubkey: "ed25519:abc123",
      signer: mockSigner,
    });

    expect(att.poha_version).toBe("0.1");
    expect(att.content_hash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(att.effort_score).toBe(0.82); // rounded to 2 decimal places
    expect(att.effort_band).toBe("high");
    expect(att.composition_duration_ms).toBe(45000);
    expect(att.input_method).toBe("web_keyboard");
    expect(att.final_text_length).toBe(29);
    expect(att.timestamp_hour).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:00:00\.000Z$/);
    expect(att.signer_pubkey).toBe("ed25519:abc123");
    expect(att.signature).toMatch(/^ed25519:[0-9a-f]+$/);
  });

  test("rounds effort score to 2 decimal places", async () => {
    const att = await buildAttestation({
      messageText: "test",
      effortScore: 0.8275,
      effortBand: "high",
      compositionDurationMs: 1000,
      inputMethod: "web_keyboard",
      finalTextLength: 4,
      signerPubkey: "ed25519:key",
      signer: mockSigner,
    });

    expect(att.effort_score).toBe(0.83);
  });

  test("timestamp is rounded to hour", async () => {
    const att = await buildAttestation({
      messageText: "test",
      effortScore: 0.5,
      effortBand: "moderate",
      compositionDurationMs: 1000,
      inputMethod: "web_keyboard",
      finalTextLength: 4,
      signerPubkey: "ed25519:key",
      signer: mockSigner,
    });

    // Should end in :00:00.000Z (minutes and seconds zeroed)
    expect(att.timestamp_hour).toMatch(/T\d{2}:00:00\.000Z$/);
  });

  test("signer receives canonical JSON bytes (without signature field)", async () => {
    let signedBytes: Uint8Array | null = null;
    const captureSigner: Signer = async (bytes) => {
      signedBytes = bytes;
      return new Uint8Array(64);
    };

    await buildAttestation({
      messageText: "test",
      effortScore: 0.5,
      effortBand: "moderate",
      compositionDurationMs: 1000,
      inputMethod: "web_keyboard",
      finalTextLength: 4,
      signerPubkey: "ed25519:key",
      signer: captureSigner,
    });

    expect(signedBytes).not.toBeNull();

    // Decode the signed bytes back to string
    const signedStr = new TextDecoder().decode(signedBytes!);
    const parsed = JSON.parse(signedStr);

    // Should NOT contain signature field
    expect(parsed).not.toHaveProperty("signature");

    // Should contain all other fields
    expect(parsed).toHaveProperty("poha_version");
    expect(parsed).toHaveProperty("content_hash");
    expect(parsed).toHaveProperty("effort_score");
    expect(parsed).toHaveProperty("signer_pubkey");

    // Keys should be sorted
    const keys = Object.keys(parsed);
    expect(keys).toEqual([...keys].sort());
  });

  test("timestamp_hour is always rounded to UTC hour (no :30/:45 minutes)", async () => {
    const att = await buildAttestation({
      messageText: "timezone test",
      effortScore: 0.5,
      effortBand: "moderate",
      compositionDurationMs: 1000,
      inputMethod: "web_keyboard",
      finalTextLength: 13,
      signerPubkey: "ed25519:key",
      signer: mockSigner,
    });

    // Must end in :00:00.000Z — never :30 or :45 from half-hour timezones
    expect(att.timestamp_hour).toMatch(/T\d{2}:00:00\.000Z$/);
    // Parse and verify minutes are exactly 0 in UTC
    const ts = new Date(att.timestamp_hour);
    expect(ts.getUTCMinutes()).toBe(0);
    expect(ts.getUTCSeconds()).toBe(0);
    expect(ts.getUTCMilliseconds()).toBe(0);
  });

  test("different messages produce different content hashes", async () => {
    const att1 = await buildAttestation({
      messageText: "hello",
      effortScore: 0.5,
      effortBand: "moderate",
      compositionDurationMs: 1000,
      inputMethod: "web_keyboard",
      finalTextLength: 5,
      signerPubkey: "ed25519:key",
      signer: mockSigner,
    });

    const att2 = await buildAttestation({
      messageText: "world",
      effortScore: 0.5,
      effortBand: "moderate",
      compositionDurationMs: 1000,
      inputMethod: "web_keyboard",
      finalTextLength: 5,
      signerPubkey: "ed25519:key",
      signer: mockSigner,
    });

    expect(att1.content_hash).not.toBe(att2.content_hash);
  });
});

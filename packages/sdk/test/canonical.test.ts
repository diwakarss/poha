import { describe, expect, test } from "bun:test";
import { canonicalJSON, toUTF8Bytes, bytesToHex } from "../src/canonical.js";

describe("canonicalJSON", () => {
  test("sorts keys alphabetically", () => {
    const obj = { z: 1, a: 2, m: 3 };
    expect(canonicalJSON(obj)).toBe('{"a":2,"m":3,"z":1}');
  });

  test("sorts nested object keys", () => {
    const obj = { b: { z: 1, a: 2 }, a: 1 };
    expect(canonicalJSON(obj)).toBe('{"a":1,"b":{"a":2,"z":1}}');
  });

  test("produces no whitespace", () => {
    const obj = { key: "value", num: 42 };
    const json = canonicalJSON(obj);
    expect(json).not.toContain(" ");
    expect(json).not.toContain("\n");
    expect(json).not.toContain("\t");
  });

  test("handles string values with special characters", () => {
    const obj = { key: 'hello "world"' };
    expect(canonicalJSON(obj)).toBe('{"key":"hello \\"world\\""}');
  });

  test("handles number values", () => {
    const obj = { float: 0.82, int: 42 };
    expect(canonicalJSON(obj)).toBe('{"float":0.82,"int":42}');
  });

  test("handles boolean and null", () => {
    const obj = { a: true, b: false, c: null };
    expect(canonicalJSON(obj)).toBe('{"a":true,"b":false,"c":null}');
  });

  test("handles arrays (not sorted, preserved order)", () => {
    const obj = { arr: [3, 1, 2] };
    expect(canonicalJSON(obj)).toBe('{"arr":[3,1,2]}');
  });

  test("matches expected attestation format", () => {
    const attestation = {
      poha_version: "0.1",
      content_hash: "sha256:abc123",
      effort_score: 0.82,
      effort_band: "high",
      composition_duration_ms: 184000,
      input_method: "web_keyboard",
      final_text_length: 312,
      timestamp_hour: "2026-04-01T14:00:00.000Z",
      signer_pubkey: "ed25519:def456",
    };

    const json = canonicalJSON(attestation);

    // Keys should be alphabetical
    const parsed = JSON.parse(json);
    const keys = Object.keys(parsed);
    const sortedKeys = [...keys].sort();
    expect(keys).toEqual(sortedKeys);

    // Specific expected output
    expect(json).toContain('"composition_duration_ms":184000');
    expect(json).toContain('"content_hash":"sha256:abc123"');
    expect(json).toContain('"effort_band":"high"');
    expect(json).toContain('"effort_score":0.82');
  });
});

describe("toUTF8Bytes", () => {
  test("encodes ASCII string", () => {
    const bytes = toUTF8Bytes("hello");
    expect(bytes).toEqual(new Uint8Array([104, 101, 108, 108, 111]));
  });

  test("encodes empty string", () => {
    const bytes = toUTF8Bytes("");
    expect(bytes.length).toBe(0);
  });

  test("encodes Unicode correctly", () => {
    const bytes = toUTF8Bytes("✍️");
    expect(bytes.length).toBeGreaterThan(1); // multi-byte
  });
});

describe("bytesToHex", () => {
  test("encodes empty array", () => {
    expect(bytesToHex(new Uint8Array([]))).toBe("");
  });

  test("encodes known bytes", () => {
    expect(bytesToHex(new Uint8Array([0, 1, 15, 16, 255]))).toBe("00010f10ff");
  });

  test("produces lowercase hex", () => {
    const hex = bytesToHex(new Uint8Array([171, 205])); // 0xAB, 0xCD
    expect(hex).toBe("abcd");
    expect(hex).toBe(hex.toLowerCase());
  });
});

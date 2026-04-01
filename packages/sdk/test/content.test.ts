import { describe, expect, test } from "bun:test";
import { normalizeContent, contentHash } from "../src/content.js";

describe("normalizeContent", () => {
  test("trims whitespace", () => {
    expect(normalizeContent("  hello  ")).toBe("hello");
  });

  test("trims tabs and newlines", () => {
    expect(normalizeContent("\n\thello\n")).toBe("hello");
  });

  test("collapses 3+ consecutive newlines to double-newline", () => {
    expect(normalizeContent("a\n\n\nb")).toBe("a\n\nb");
    expect(normalizeContent("a\n\n\n\n\nb")).toBe("a\n\nb");
  });

  test("preserves double newlines", () => {
    expect(normalizeContent("a\n\nb")).toBe("a\n\nb");
  });

  test("preserves single newlines", () => {
    expect(normalizeContent("a\nb")).toBe("a\nb");
  });

  test("normalizes to NFC", () => {
    // é as e + combining acute (NFD) → é as single char (NFC)
    const nfd = "e\u0301"; // e + combining accent
    const nfc = "\u00e9";  // precomposed é
    expect(normalizeContent(nfd)).toBe(nfc);
  });

  test("handles empty string", () => {
    expect(normalizeContent("")).toBe("");
  });

  test("handles only whitespace", () => {
    expect(normalizeContent("   \n\n  ")).toBe("");
  });
});

describe("contentHash", () => {
  test("returns sha256-prefixed hex string", async () => {
    const hash = await contentHash("hello");
    expect(hash).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  test("same content produces same hash", async () => {
    const h1 = await contentHash("hello world");
    const h2 = await contentHash("hello world");
    expect(h1).toBe(h2);
  });

  test("different content produces different hash", async () => {
    const h1 = await contentHash("hello");
    const h2 = await contentHash("world");
    expect(h1).not.toBe(h2);
  });

  test("normalizes before hashing", async () => {
    // Trailing whitespace should be trimmed, so these should match
    const h1 = await contentHash("hello");
    const h2 = await contentHash("  hello  ");
    expect(h1).toBe(h2);
  });

  test("NFC normalization affects hash", async () => {
    // NFD and NFC of é should produce the same hash after normalization
    const h1 = await contentHash("caf\u00e9");       // NFC
    const h2 = await contentHash("cafe\u0301");       // NFD
    expect(h1).toBe(h2);
  });

  test("newline collapsing affects hash", async () => {
    const h1 = await contentHash("a\n\nb");
    const h2 = await contentHash("a\n\n\n\nb");
    expect(h1).toBe(h2);
  });

  test("known SHA-256 value for 'hello'", async () => {
    const hash = await contentHash("hello");
    // SHA-256 of "hello" is well-known
    expect(hash).toBe(
      "sha256:2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
    );
  });
});

import { describe, expect, test } from "bun:test";
import { generateShortId } from "../src/short-id.js";

describe("generateShortId", () => {
  test("produces a 5-character string", () => {
    const id = generateShortId();
    expect(id.length).toBe(5);
  });

  test("contains only alphanumeric characters", () => {
    for (let i = 0; i < 100; i++) {
      const id = generateShortId();
      expect(id).toMatch(/^[A-Za-z0-9]{5}$/);
    }
  });

  test("generates unique IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateShortId());
    }
    // With 62^5 = ~916M possibilities, 1000 IDs should all be unique
    expect(ids.size).toBe(1000);
  });
});

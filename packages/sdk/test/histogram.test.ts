import { describe, expect, test } from "bun:test";
import { buildIKIHistogram } from "../src/histogram.js";
import type { InputEvent } from "../src/types.js";
import { IKI_BIN_COUNT } from "../src/types.js";

function keydown(timestamp: number): InputEvent {
  return { timestamp, type: "keydown", charCountDelta: 1 };
}

describe("buildIKIHistogram", () => {
  test("returns empty histogram for no events", () => {
    const h = buildIKIHistogram([]);
    expect(h.length).toBe(IKI_BIN_COUNT);
    expect(h.reduce((a, b) => a + b, 0)).toBe(0);
  });

  test("returns empty histogram for single keydown", () => {
    const h = buildIKIHistogram([keydown(1000)]);
    expect(h.reduce((a, b) => a + b, 0)).toBe(0);
  });

  test("places 100ms interval in bin 2 (100-150ms)", () => {
    const h = buildIKIHistogram([keydown(0), keydown(100)]);
    expect(h[2]).toBe(1); // bin 2 = [100, 150)
    expect(h.reduce((a, b) => a + b, 0)).toBe(1);
  });

  test("places 0ms interval in bin 0", () => {
    const h = buildIKIHistogram([keydown(0), keydown(0)]);
    expect(h[0]).toBe(1);
  });

  test("clamps intervals >= 5000ms to last bin", () => {
    const h = buildIKIHistogram([keydown(0), keydown(10000)]);
    expect(h[99]).toBe(1); // last bin
  });

  test("counts multiple intervals correctly", () => {
    // Three keydowns: intervals of 100ms and 200ms
    const h = buildIKIHistogram([keydown(0), keydown(100), keydown(300)]);
    expect(h[2]).toBe(1); // 100ms → bin 2
    expect(h[4]).toBe(1); // 200ms → bin 4
    expect(h.reduce((a, b) => a + b, 0)).toBe(2);
  });

  test("ignores non-keydown events", () => {
    const events: InputEvent[] = [
      keydown(0),
      { timestamp: 50, type: "paste", charCountDelta: 10 },
      keydown(100),
    ];
    const h = buildIKIHistogram(events);
    expect(h[2]).toBe(1); // 100ms interval between the two keydowns
    expect(h.reduce((a, b) => a + b, 0)).toBe(1);
  });

  test("ignores keydowns with non-positive charCountDelta", () => {
    const events: InputEvent[] = [
      keydown(0),
      { timestamp: 50, type: "keydown", charCountDelta: 0 }, // modifier key
      keydown(100),
    ];
    const h = buildIKIHistogram(events);
    // Only two valid keydowns, interval = 100ms
    expect(h[2]).toBe(1);
    expect(h.reduce((a, b) => a + b, 0)).toBe(1);
  });
});

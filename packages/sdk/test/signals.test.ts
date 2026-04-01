import { describe, expect, test } from "bun:test";
import { extractSignals } from "../src/signals.js";
import type { InputEvent } from "../src/types.js";

function keydown(timestamp: number): InputEvent {
  return { timestamp, type: "keydown", charCountDelta: 1 };
}

describe("extractSignals", () => {
  test("returns zeros for empty events", () => {
    const s = extractSignals([]);
    expect(s.durationMs).toBe(0);
    expect(s.entropy).toBe(0);
    expect(s.pasteRatio).toBe(0);
    expect(s.revisionRate).toBe(0);
    expect(s.eventDensity).toBe(0);
  });

  test("calculates duration from first to last event", () => {
    const s = extractSignals([keydown(1000), keydown(1100), keydown(2000)]);
    expect(s.durationMs).toBe(1000);
  });

  test("calculates paste ratio", () => {
    const events: InputEvent[] = [
      keydown(0),
      keydown(100),
      { timestamp: 200, type: "paste", charCountDelta: 8 },
    ];
    const s = extractSignals(events);
    // 2 typed + 8 pasted = 10 total. Paste ratio = 8/10 = 0.8
    expect(s.pasteRatio).toBeCloseTo(0.8, 5);
  });

  test("paste ratio is 0 for pure typing", () => {
    const s = extractSignals([keydown(0), keydown(100), keydown(200)]);
    expect(s.pasteRatio).toBe(0);
  });

  test("paste ratio is 1 for pure paste", () => {
    const events: InputEvent[] = [
      { timestamp: 0, type: "paste", charCountDelta: 100 },
    ];
    const s = extractSignals(events);
    expect(s.pasteRatio).toBe(1);
  });

  test("calculates revision rate", () => {
    const events: InputEvent[] = [
      keydown(0),
      keydown(100),
      keydown(200),
      keydown(300),
      keydown(400),
      // 5 characters typed, 2 deletions
      { timestamp: 500, type: "character_removed", charCountDelta: -1 },
      { timestamp: 600, type: "character_removed", charCountDelta: -1 },
    ];
    const s = extractSignals(events);
    // 2 removals / 5 typed chars * 100 = 40
    expect(s.revisionRate).toBeCloseTo(40, 5);
  });

  test("calculates event density", () => {
    // 10 keydowns over 2 seconds
    const events: InputEvent[] = [];
    for (let i = 0; i < 10; i++) {
      events.push(keydown(i * 200)); // 200ms apart, total 1800ms
    }
    const s = extractSignals(events);
    // 10 keydowns / 1.8 seconds ≈ 5.56 events/sec
    expect(s.eventDensity).toBeCloseTo(10 / 1.8, 1);
  });

  test("entropy is positive for varied typing", () => {
    // Keydowns with varying intervals
    const events = [
      keydown(0),
      keydown(80),   // 80ms
      keydown(200),  // 120ms
      keydown(500),  // 300ms
      keydown(550),  // 50ms
      keydown(900),  // 350ms
      keydown(1100), // 200ms
    ];
    const s = extractSignals(events);
    expect(s.entropy).toBeGreaterThan(0);
  });
});

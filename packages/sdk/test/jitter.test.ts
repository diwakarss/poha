import { describe, expect, test } from "bun:test";
import { jitterRegularity } from "../src/jitter.js";
import type { InputEvent } from "../src/types.js";

function keydown(timestamp: number): InputEvent {
  return { timestamp, type: "keydown", charCountDelta: 1 };
}

describe("jitterRegularity", () => {
  test("returns 0 for empty events", () => {
    expect(jitterRegularity([])).toBe(0);
  });

  test("returns 0 for too few events", () => {
    // 5 keydowns = 4 intervals, only 0 full windows of 5
    const events = [keydown(0), keydown(100), keydown(200), keydown(300), keydown(400)];
    expect(jitterRegularity(events)).toBe(0);
  });

  test("low score for perfectly regular jitter (scripted)", () => {
    // Scripted: intervals alternate between 100ms and 200ms — regular pattern
    // Repeating this many times creates windows with identical variance
    const events: InputEvent[] = [keydown(0)];
    let t = 0;
    for (let i = 0; i < 30; i++) {
      t += i % 2 === 0 ? 100 : 200;
      events.push(keydown(t));
    }
    const score = jitterRegularity(events);
    expect(score).toBeLessThan(0.5);
  });

  test("higher score for irregular human-like jitter", () => {
    // Human-like: bursts of fast typing, then pauses, then moderate
    const intervals = [
      80, 90, 75, 85, 95,      // fast burst
      400, 350, 500, 450, 380,  // slow/thinking
      120, 110, 130, 150, 140,  // moderate
      60, 70, 50, 80, 65,       // another fast burst
      300, 250, 600, 200, 350,  // irregular pause
    ];
    const events: InputEvent[] = [keydown(0)];
    let t = 0;
    for (const iki of intervals) {
      t += iki;
      events.push(keydown(t));
    }
    const score = jitterRegularity(events);
    expect(score).toBeGreaterThan(0.3);
  });

  test("scripted jitter scores lower than human jitter", () => {
    // Scripted: uniform random jitter around 150ms ±50ms
    const scriptedEvents: InputEvent[] = [keydown(0)];
    let t = 0;
    // Seed-like deterministic "random" for reproducibility
    const scriptedIntervals = [
      130, 170, 140, 160, 150, 135, 165, 145, 155, 148,
      132, 168, 142, 158, 152, 138, 162, 147, 153, 149,
      131, 169, 141, 159, 151, 137, 163, 146, 154, 143,
    ];
    for (const iki of scriptedIntervals) {
      t += iki;
      scriptedEvents.push(keydown(t));
    }

    // Human: varied rhythm with bursts and pauses
    const humanEvents: InputEvent[] = [keydown(0)];
    t = 0;
    const humanIntervals = [
      80, 85, 90, 75, 95,       // fast
      400, 350, 500, 300, 450,  // slow
      120, 130, 110, 140, 125,  // medium
      50, 60, 55, 70, 45,       // very fast
      250, 600, 200, 800, 150,  // erratic pause
      100, 90, 110, 95, 105,    // steady
    ];
    for (const iki of humanIntervals) {
      t += iki;
      humanEvents.push(keydown(t));
    }

    const scriptedScore = jitterRegularity(scriptedEvents);
    const humanScore = jitterRegularity(humanEvents);
    expect(humanScore).toBeGreaterThan(scriptedScore);
  });

  test("ignores non-keydown events", () => {
    const events: InputEvent[] = [
      keydown(0),
      { timestamp: 50, type: "paste", charCountDelta: 5 },
      keydown(100),
      { timestamp: 150, type: "character_removed", charCountDelta: -1 },
      keydown(200),
    ];
    // Only 3 keydowns = 2 intervals, not enough for windows
    expect(jitterRegularity(events)).toBe(0);
  });
});

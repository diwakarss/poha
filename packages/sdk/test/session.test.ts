import { describe, expect, test } from "bun:test";
import { TypingSession } from "../src/session.js";

describe("TypingSession", () => {
  test("starts with zero events and none band", () => {
    const session = new TypingSession();
    expect(session.eventCount).toBe(0);
    const result = session.score();
    expect(result.band).toBe("low"); // pasteRatio=0 → inverted=1.0 → 0.20 score → low
  });

  test("accumulates events", () => {
    const session = new TypingSession();
    session.addEvent({ timestamp: 0, type: "keydown", charCountDelta: 1 });
    session.addEvent({ timestamp: 100, type: "keydown", charCountDelta: 1 });
    expect(session.eventCount).toBe(2);
  });

  test("score increases with more typing", () => {
    const session = new TypingSession();
    const baseTime = Date.now();

    // Simulate realistic typing: 30 characters over 10 seconds with varied timing
    const intervals = [80, 120, 95, 110, 200, 150, 90, 85, 130, 170,
                       100, 115, 180, 90, 75, 140, 160, 95, 105, 250,
                       110, 130, 85, 145, 190, 100, 120, 95, 80, 110];
    let t = baseTime;
    for (const interval of intervals) {
      t += interval;
      session.addEvent({ timestamp: t, type: "keydown", charCountDelta: 1 });
    }

    const result = session.score();
    expect(result.score).toBeGreaterThan(0);
    expect(result.signals.entropy).toBeGreaterThan(0);
    expect(result.signals.eventDensity).toBeGreaterThan(0);
  });

  test("reset clears all events", () => {
    const session = new TypingSession();
    session.addEvent({ timestamp: 0, type: "keydown", charCountDelta: 1 });
    session.addEvent({ timestamp: 100, type: "keydown", charCountDelta: 1 });
    expect(session.eventCount).toBe(2);

    session.reset();
    expect(session.eventCount).toBe(0);
  });

  test("getEvents returns readonly array", () => {
    const session = new TypingSession();
    session.addEvent({ timestamp: 0, type: "keydown", charCountDelta: 1 });
    const events = session.getEvents();
    expect(events.length).toBe(1);
    expect(events[0].timestamp).toBe(0);
  });
});

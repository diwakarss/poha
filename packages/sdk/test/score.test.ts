import { describe, expect, test } from "bun:test";
import { computeScore, effortBand } from "../src/score.js";
import type { RawSignals } from "../src/types.js";

describe("effortBand", () => {
  test("none for score 0", () => expect(effortBand(0)).toBe("none"));
  test("none for score 0.05", () => expect(effortBand(0.05)).toBe("none"));
  test("low for score 0.1", () => expect(effortBand(0.1)).toBe("low"));
  test("low for score 0.29", () => expect(effortBand(0.29)).toBe("low"));
  test("moderate for score 0.3", () => expect(effortBand(0.3)).toBe("moderate"));
  test("moderate for score 0.59", () => expect(effortBand(0.59)).toBe("moderate"));
  test("high for score 0.6", () => expect(effortBand(0.6)).toBe("high"));
  test("high for score 1.0", () => expect(effortBand(1.0)).toBe("high"));
});

describe("computeScore", () => {
  test("all-zero signals produce score near 0", () => {
    const raw: RawSignals = {
      durationMs: 0,
      entropy: 0,
      pasteRatio: 0,
      revisionRate: 0,
      eventDensity: 0,
    };
    const result = computeScore(raw);
    // pasteRatio of 0 → inverted = 1.0, weighted at 0.20 = 0.20
    // All others at 0. Score = 0.20
    expect(result.score).toBeCloseTo(0.20, 2);
    expect(result.band).toBe("low");
  });

  test("all-max signals produce score of 1.0", () => {
    const raw: RawSignals = {
      durationMs: 300_000,  // well above 180k max
      entropy: 5.0,         // well above 3.5 max
      pasteRatio: 0,        // no paste → inverted = 1.0
      revisionRate: 15,     // above 10 max
      eventDensity: 5.0,    // above 3.0 max
    };
    const result = computeScore(raw);
    expect(result.score).toBeCloseTo(1.0, 2);
    expect(result.band).toBe("high");
  });

  test("all-paste produces low score", () => {
    const raw: RawSignals = {
      durationMs: 100_000,
      entropy: 2.0,
      pasteRatio: 1.0,      // all paste → inverted = 0.0
      revisionRate: 5,
      eventDensity: 2.0,
    };
    const result = computeScore(raw);
    // pasteRatio contributes 0. Other signals still contribute.
    expect(result.score).toBeLessThan(0.8);
  });

  test("realistic human typing session", () => {
    const raw: RawSignals = {
      durationMs: 60_000,   // 1 minute
      entropy: 2.5,         // moderate variation
      pasteRatio: 0.05,     // 5% paste
      revisionRate: 4,      // some backspacing
      eventDensity: 2.0,    // moderate typing speed
    };
    const result = computeScore(raw);
    expect(result.score).toBeGreaterThan(0.3);
    expect(result.score).toBeLessThan(0.95);
    expect(["high", "moderate"]).toContain(result.band);
  });

  test("weights sum to 1.0", () => {
    const { DEFAULT_SIGNAL_CONFIG } = require("../src/types.js");
    const totalWeight = Object.values(DEFAULT_SIGNAL_CONFIG).reduce(
      (sum: number, cfg: any) => sum + cfg.weight,
      0
    );
    expect(totalWeight).toBeCloseTo(1.0, 10);
  });

  test("score is clamped to [0, 1]", () => {
    const raw: RawSignals = {
      durationMs: 1_000_000,
      entropy: 10,
      pasteRatio: 0,
      revisionRate: 100,
      eventDensity: 100,
    };
    const result = computeScore(raw);
    expect(result.score).toBeLessThanOrEqual(1.0);
    expect(result.score).toBeGreaterThanOrEqual(0.0);
  });

  test("handles degenerate config where max <= min", () => {
    const raw: RawSignals = {
      durationMs: 90_000,
      entropy: 2.0,
      pasteRatio: 0.1,
      revisionRate: 5,
      eventDensity: 1.5,
    };
    // Config with max === min for duration (degenerate)
    const config = {
      duration: { weight: 0.25, min: 100, max: 100 },
      entropy: { weight: 0.20, min: 0, max: 3.5 },
      pasteRatio: { weight: 0.20, min: 0, max: 1 },
      revisionRate: { weight: 0.15, min: 0, max: 10 },
      eventDensity: { weight: 0.20, min: 0, max: 3 },
    };
    const result = computeScore(raw, config);
    // Duration normalized to 0 (max <= min), so it contributes 0
    expect(result.signals.duration).toBe(0);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  test("individual signals are in result", () => {
    const raw: RawSignals = {
      durationMs: 90_000,
      entropy: 2.0,
      pasteRatio: 0.1,
      revisionRate: 5,
      eventDensity: 1.5,
    };
    const result = computeScore(raw);
    expect(result.signals.duration).toBeGreaterThan(0);
    expect(result.signals.entropy).toBeGreaterThan(0);
    expect(result.signals.pasteRatio).toBeGreaterThan(0);
    expect(result.signals.revisionRate).toBeGreaterThan(0);
    expect(result.signals.eventDensity).toBeGreaterThan(0);
  });
});

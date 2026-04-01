import { describe, expect, test } from "bun:test";
import { effortBand } from "../src/score.js";
import type { EffortBand } from "../src/types.js";
import { EFFORT_THRESHOLDS } from "../src/types.js";

/**
 * T-4: Score/band boundary tests.
 * Verify exact behavior at threshold values (0.0, 0.1, 0.3, 0.6, 1.0).
 */
describe("score/band boundaries", () => {
  const cases: [number, EffortBand][] = [
    // none: [0.0, 0.1)
    [0.0, "none"],
    [0.05, "none"],
    [0.09999, "none"],

    // low: [0.1, 0.3)
    [0.1, "low"],
    [0.1001, "low"],
    [0.2, "low"],
    [0.2999, "low"],

    // moderate: [0.3, 0.6)
    [0.3, "moderate"],
    [0.3001, "moderate"],
    [0.45, "moderate"],
    [0.5999, "moderate"],

    // high: [0.6, 1.0]
    [0.6, "high"],
    [0.6001, "high"],
    [0.85, "high"],
    [1.0, "high"],
  ];

  for (const [score, expectedBand] of cases) {
    test(`score ${score} → band "${expectedBand}"`, () => {
      expect(effortBand(score)).toBe(expectedBand);
    });
  }

  test("thresholds are consistent: none < low < moderate < high", () => {
    expect(EFFORT_THRESHOLDS.none).toBeLessThan(EFFORT_THRESHOLDS.low);
    expect(EFFORT_THRESHOLDS.low).toBeLessThan(EFFORT_THRESHOLDS.moderate);
    expect(EFFORT_THRESHOLDS.moderate).toBeLessThan(EFFORT_THRESHOLDS.high);
  });

  test("worker BAND_THRESHOLDS ranges are contiguous with SDK thresholds", () => {
    const workerBands: Record<string, [number, number]> = {
      none: [0.0, 0.1],
      low: [0.1, 0.3],
      moderate: [0.3, 0.6],
      high: [0.6, 1.0],
    };

    expect(EFFORT_THRESHOLDS.none).toBe(workerBands.none[0]);
    expect(EFFORT_THRESHOLDS.low).toBe(workerBands.low[0]);
    expect(EFFORT_THRESHOLDS.moderate).toBe(workerBands.moderate[0]);
    expect(EFFORT_THRESHOLDS.high).toBe(workerBands.high[0]);
  });
});

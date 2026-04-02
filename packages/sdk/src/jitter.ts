import type { InputEvent } from "./types.js";

/**
 * Jitter regularity detection.
 *
 * Real human typing has irregularly irregular rhythm — the variance of
 * inter-keystroke intervals changes unpredictably across windows.
 * Scripted typing with random jitter is regularly irregular — each window
 * has similar variance.
 *
 * This function computes the coefficient of variation (CV) of per-window
 * IKI variances. High CV = human (variance keeps changing). Low CV =
 * scripted (variance is suspiciously consistent).
 *
 * Returns a value in [0, ∞). Typical human range: 0.3–2.0+.
 * Typical scripted range: 0.0–0.3.
 */

const WINDOW_SIZE = 5;
const MIN_WINDOWS = 3;

/** Extract raw IKI intervals (ms) from events. */
function ikiIntervals(events: InputEvent[]): number[] {
  const keydowns = events.filter(
    (e) => e.type === "keydown" && e.charCountDelta > 0
  );
  const intervals: number[] = [];
  for (let i = 1; i < keydowns.length; i++) {
    intervals.push(keydowns[i].timestamp - keydowns[i - 1].timestamp);
  }
  return intervals;
}

function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}

/**
 * Compute jitter regularity score (CV of per-window IKI variance).
 * Returns 0 if not enough data (fewer than MIN_WINDOWS windows of WINDOW_SIZE).
 */
export function jitterRegularity(events: InputEvent[]): number {
  const intervals = ikiIntervals(events);

  // Sliding windows of WINDOW_SIZE intervals
  const windowVars: number[] = [];
  for (let i = 0; i <= intervals.length - WINDOW_SIZE; i++) {
    windowVars.push(variance(intervals.slice(i, i + WINDOW_SIZE)));
  }

  if (windowVars.length < MIN_WINDOWS) return 0;

  const meanVar =
    windowVars.reduce((a, b) => a + b, 0) / windowVars.length;
  if (meanVar === 0) return 0;

  const stdVar = Math.sqrt(variance(windowVars));
  return stdVar / meanVar; // coefficient of variation
}

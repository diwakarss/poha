import type { InputEvent, IKIHistogram } from "./types.js";
import { IKI_BIN_COUNT, IKI_BIN_WIDTH_MS, IKI_MAX_MS } from "./types.js";

/**
 * Build an IKI (inter-keystroke interval) histogram from input events.
 *
 * Only considers consecutive keydown events for character keys.
 * Intervals are placed into 50ms-wide bins (0-5000ms range).
 * Intervals >= 5000ms are clamped to the last bin.
 *
 * Returns a Float64Array of length 100 with raw counts (not normalized).
 */
export function buildIKIHistogram(events: InputEvent[]): IKIHistogram {
  const histogram = new Float64Array(IKI_BIN_COUNT);

  // Filter to keydown events only (these represent character key presses)
  const keydowns = events.filter(
    (e) => e.type === "keydown" && e.charCountDelta > 0
  );

  for (let i = 1; i < keydowns.length; i++) {
    const iki = keydowns[i].timestamp - keydowns[i - 1].timestamp;
    const clampedIki = Math.min(Math.max(iki, 0), IKI_MAX_MS - 1);
    const bin = Math.floor(clampedIki / IKI_BIN_WIDTH_MS);
    histogram[bin]++;
  }

  return histogram;
}

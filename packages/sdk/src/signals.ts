import type { InputEvent, RawSignals } from "./types.js";
import { buildIKIHistogram } from "./histogram.js";
import { shannonEntropy } from "./entropy.js";
import { jitterRegularity } from "./jitter.js";

/**
 * Extract raw signal values from a sequence of input events.
 *
 * This is the bridge between platform-specific event collection and
 * the platform-agnostic scoring engine.
 */
export function extractSignals(events: InputEvent[]): RawSignals {
  if (events.length === 0) {
    return {
      durationMs: 0,
      entropy: 0,
      pasteRatio: 0,
      revisionRate: 0,
      eventDensity: 0,
      jitter: 0,
    };
  }

  // Duration: first event to last event
  const durationMs = events[events.length - 1].timestamp - events[0].timestamp;

  // IKI histogram, entropy, and jitter regularity
  const histogram = buildIKIHistogram(events);
  const entropy = shannonEntropy(histogram);
  const jitter = jitterRegularity(events);

  // Character counts by source
  let typedChars = 0;
  let pastedChars = 0;
  let removedChars = 0;
  let keydownCount = 0;

  for (const event of events) {
    switch (event.type) {
      case "keydown":
        if (event.charCountDelta > 0) {
          typedChars += event.charCountDelta;
          keydownCount++;
        }
        break;
      case "paste":
        pastedChars += Math.max(0, event.charCountDelta);
        break;
      case "character_removed":
        removedChars += Math.abs(event.charCountDelta);
        break;
    }
  }

  // Paste ratio: pasted chars / total chars added
  const totalCharsAdded = typedChars + pastedChars;
  const pasteRatio = totalCharsAdded > 0 ? pastedChars / totalCharsAdded : 0;

  // Revision rate: removals per 100 characters typed
  const revisionRate = typedChars > 0 ? (removedChars / typedChars) * 100 : 0;

  // Event density: keydown events per second
  const durationSec = durationMs / 1000;
  const eventDensity = durationSec > 0 ? keydownCount / durationSec : 0;

  return {
    durationMs,
    entropy,
    pasteRatio,
    revisionRate,
    eventDensity,
    jitter,
  };
}

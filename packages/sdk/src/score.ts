import type { RawSignals, ScoreResult, EffortBand, SignalConfig } from "./types.js";
import { DEFAULT_SIGNAL_CONFIG, EFFORT_THRESHOLDS } from "./types.js";

/**
 * Linear clamp normalization: maps a raw value to [0, 1].
 * Values at or below min → 0. Values at or above max → 1.
 */
function normalizeLinear(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/**
 * Determine effort band from composite score.
 */
export function effortBand(score: number): EffortBand {
  if (score >= EFFORT_THRESHOLDS.high) return "high";
  if (score >= EFFORT_THRESHOLDS.moderate) return "moderate";
  if (score >= EFFORT_THRESHOLDS.low) return "low";
  return "none";
}

/**
 * Calculate composite effort score from raw signals.
 *
 * Each signal is normalized to [0, 1] via linear clamping, then
 * weighted and summed. Paste ratio is inverted (low paste = high score).
 *
 * Returns score (0.0 to 1.0), effort band, and individual normalized signals.
 */
export function computeScore(
  raw: RawSignals,
  config: Record<string, SignalConfig> = DEFAULT_SIGNAL_CONFIG
): ScoreResult {
  const normalized: Record<string, number> = {
    duration: normalizeLinear(raw.durationMs, config.duration.min, config.duration.max),
    entropy: normalizeLinear(raw.entropy, config.entropy.min, config.entropy.max),
    // Paste ratio is inverted: 0 paste = 1.0 score, all paste = 0.0 score
    pasteRatio: 1.0 - normalizeLinear(raw.pasteRatio, config.pasteRatio.min, config.pasteRatio.max),
    revisionRate: normalizeLinear(raw.revisionRate, config.revisionRate.min, config.revisionRate.max),
    eventDensity: normalizeLinear(raw.eventDensity, config.eventDensity.min, config.eventDensity.max),
    jitter: normalizeLinear(raw.jitter, config.jitter.min, config.jitter.max),
  };

  let score = 0;
  for (const [key, signalConfig] of Object.entries(config)) {
    score += (normalized[key] ?? 0) * signalConfig.weight;
  }

  // Hard gate: if more than 70% of content was pasted, cap score below badge threshold
  if (raw.pasteRatio > 0.7) {
    score = Math.min(score, EFFORT_THRESHOLDS.moderate - 0.01);
  }

  // Clamp to [0, 1] for safety
  score = Math.min(1, Math.max(0, score));

  return {
    score,
    band: effortBand(score),
    signals: normalized,
  };
}

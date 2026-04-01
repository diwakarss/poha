/**
 * Raw input event from platform layer (web DOM events or Android AccessibilityService).
 * Never contains the actual key value — only timing and category metadata.
 */
export interface InputEvent {
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** What happened */
  type: "keydown" | "keyup" | "paste" | "character_removed";
  /**
   * Change in character count. Positive for typing/paste, negative for delete.
   * For keydown of a character key: +1. For paste: +N. For backspace: -1.
   */
  charCountDelta: number;
}

/**
 * IKI (inter-keystroke interval) histogram.
 * 100 bins, each 50ms wide, covering 0-5000ms.
 * Bin i covers the interval [i*50, (i+1)*50) ms.
 */
export type IKIHistogram = Float64Array;

/** Number of bins in the IKI histogram */
export const IKI_BIN_COUNT = 100;

/** Width of each bin in milliseconds */
export const IKI_BIN_WIDTH_MS = 50;

/** Maximum interval captured (5000ms). Anything above goes in the last bin. */
export const IKI_MAX_MS = IKI_BIN_COUNT * IKI_BIN_WIDTH_MS;

/** Effort band labels */
export type EffortBand = "none" | "low" | "moderate" | "high";

/** Score normalization config for a single signal */
export interface SignalConfig {
  weight: number;
  min: number;
  max: number;
}

/** Default v1 signal weights and normalization ranges */
export const DEFAULT_SIGNAL_CONFIG: Record<string, SignalConfig> = {
  duration: { weight: 0.25, min: 5_000, max: 180_000 },
  entropy: { weight: 0.30, min: 0.5, max: 3.5 },
  pasteRatio: { weight: 0.20, min: 0, max: 1 },
  revisionRate: { weight: 0.15, min: 0, max: 10 },
  eventDensity: { weight: 0.10, min: 0.5, max: 3.0 },
};

/** Effort band thresholds */
export const EFFORT_THRESHOLDS = {
  none: 0.0,
  low: 0.1,
  moderate: 0.4,
  high: 0.7,
} as const;

/** Badge-ready threshold (moderate or above) */
export const BADGE_READY_THRESHOLD = EFFORT_THRESHOLDS.moderate;

/** Raw signal values extracted from a typing session */
export interface RawSignals {
  /** Total duration from first to last event, in ms */
  durationMs: number;
  /** Shannon entropy over IKI histogram, in bits */
  entropy: number;
  /** Ratio of pasted characters to total characters (0.0 to 1.0) */
  pasteRatio: number;
  /** Revision rate: character removals per 100 characters typed */
  revisionRate: number;
  /** Event density: keydown events per second */
  eventDensity: number;
}

/** Composite score result */
export interface ScoreResult {
  /** Composite effort score, 0.0 to 1.0 */
  score: number;
  /** Effort band */
  band: EffortBand;
  /** Individual normalized signal values (0.0 to 1.0 each) */
  signals: Record<string, number>;
}

/**
 * Async signer interface. Platform layer injects the signing implementation.
 * Web: @noble/ed25519. Android: Kotlin bridge to Android Keystore.
 */
export type Signer = (bytes: Uint8Array) => Promise<Uint8Array>;

/** Attestation JSON (before signature) */
export interface Attestation {
  poha_version: string;
  content_hash: string;
  effort_score: number;
  effort_band: EffortBand;
  composition_duration_ms: number;
  input_method: "web_keyboard" | "accessibility_observed" | "compose_in_app";
  final_text_length: number;
  timestamp_hour: string;
  signer_pubkey: string;
  signature: string;
}

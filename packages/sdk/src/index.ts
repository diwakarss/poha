// Types
export type {
  InputEvent,
  IKIHistogram,
  EffortBand,
  SignalConfig,
  RawSignals,
  ScoreResult,
  Signer,
  Attestation,
} from "./types.js";

export {
  IKI_BIN_COUNT,
  IKI_BIN_WIDTH_MS,
  IKI_MAX_MS,
  DEFAULT_SIGNAL_CONFIG,
  EFFORT_THRESHOLDS,
  BADGE_READY_THRESHOLD,
} from "./types.js";

// Histogram
export { buildIKIHistogram } from "./histogram.js";

// Entropy
export { shannonEntropy } from "./entropy.js";

// Signals
export { extractSignals } from "./signals.js";

// Jitter
export { jitterRegularity } from "./jitter.js";

// Score
export { computeScore, effortBand } from "./score.js";

// Content
export { normalizeContent, contentHash } from "./content.js";

// Canonical JSON
export { canonicalJSON, toUTF8Bytes, bytesToHex } from "./canonical.js";

// Attestation
export { buildAttestation } from "./attestation.js";
export type { AttestationParams, InputMethod } from "./attestation.js";

// Session
export { TypingSession } from "./session.js";

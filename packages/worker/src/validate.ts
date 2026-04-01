import * as ed from "@noble/ed25519";
import type { Attestation } from "./types.js";

const VALID_BANDS = ["none", "low", "moderate", "high"] as const;
const VALID_INPUT_METHODS = ["web_keyboard", "accessibility_observed", "compose_in_app"] as const;
const POHA_VERSION = "0.1";
const MAX_TIMESTAMP_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Band thresholds for consistency checking */
const BAND_THRESHOLDS = {
  none: [0.0, 0.1],
  low: [0.1, 0.4],
  moderate: [0.4, 0.7],
  high: [0.7, 1.0],
} as const;

/**
 * Canonical JSON: sorted keys, no whitespace.
 * Must match the SDK's canonicalJSON() exactly.
 */
function canonicalJSON(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, (_key, value) => {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(value as Record<string, unknown>).sort()) {
        sorted[k] = (value as Record<string, unknown>)[k];
      }
      return sorted;
    }
    return value;
  });
}

/** Hex string to Uint8Array */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate an attestation: structure, signature, timestamp, score/band consistency.
 */
export async function validateAttestation(att: Attestation): Promise<ValidationResult> {
  // 1. Version check
  if (att.poha_version !== POHA_VERSION) {
    return { valid: false, error: `unsupported version: ${att.poha_version}` };
  }

  // 2. Required fields
  if (!att.content_hash || !att.signer_pubkey || !att.signature || !att.timestamp_hour) {
    return { valid: false, error: "missing required fields" };
  }

  // 3. Content hash format
  if (!/^sha256:[0-9a-f]{64}$/.test(att.content_hash)) {
    return { valid: false, error: "invalid content_hash format" };
  }

  // 4. Effort score range
  if (typeof att.effort_score !== "number" || att.effort_score < 0 || att.effort_score > 1) {
    return { valid: false, error: "effort_score must be 0.0 to 1.0" };
  }

  // 5. Valid band
  if (!VALID_BANDS.includes(att.effort_band as any)) {
    return { valid: false, error: `invalid effort_band: ${att.effort_band}` };
  }

  // 6. Score/band consistency
  const [bandMin, bandMax] = BAND_THRESHOLDS[att.effort_band];
  if (att.effort_score < bandMin || att.effort_score > bandMax) {
    return { valid: false, error: `effort_score ${att.effort_score} inconsistent with band ${att.effort_band}` };
  }

  // 7. Valid input method
  if (!VALID_INPUT_METHODS.includes(att.input_method as any)) {
    return { valid: false, error: `invalid input_method: ${att.input_method}` };
  }

  // 8. Timestamp format and freshness
  const tsRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:00:00\.000Z$/;
  if (!tsRegex.test(att.timestamp_hour)) {
    return { valid: false, error: "timestamp_hour must be rounded to the hour" };
  }
  const tsDate = new Date(att.timestamp_hour);
  if (isNaN(tsDate.getTime())) {
    return { valid: false, error: "invalid timestamp_hour" };
  }
  const age = Date.now() - tsDate.getTime();
  if (age > MAX_TIMESTAMP_AGE_MS) {
    return { valid: false, error: "timestamp_hour is older than 24 hours" };
  }
  if (age < -MAX_TIMESTAMP_AGE_MS) {
    return { valid: false, error: "timestamp_hour is in the future" };
  }

  // 9. Positive duration and text length
  if (typeof att.composition_duration_ms !== "number" || att.composition_duration_ms < 0) {
    return { valid: false, error: "composition_duration_ms must be non-negative" };
  }
  if (typeof att.final_text_length !== "number" || att.final_text_length < 0) {
    return { valid: false, error: "final_text_length must be non-negative" };
  }

  // 10. Signature verification
  // Build the signing input: canonical JSON of attestation without the signature field
  const { signature, ...unsigned } = att;
  const signingInput = new TextEncoder().encode(canonicalJSON(unsigned as Record<string, unknown>));

  // Parse pubkey: "ed25519:<hex>"
  const pubkeyMatch = att.signer_pubkey.match(/^ed25519:([0-9a-f]+)$/);
  if (!pubkeyMatch) {
    return { valid: false, error: "invalid signer_pubkey format" };
  }
  const pubkeyBytes = hexToBytes(pubkeyMatch[1]);

  // Parse signature: "ed25519:<hex>"
  const sigMatch = signature.match(/^ed25519:([0-9a-f]+)$/);
  if (!sigMatch) {
    return { valid: false, error: "invalid signature format" };
  }
  const sigBytes = hexToBytes(sigMatch[1]);

  try {
    const valid = await ed.verifyAsync(sigBytes, signingInput, pubkeyBytes);
    if (!valid) {
      return { valid: false, error: "signature verification failed" };
    }
  } catch {
    return { valid: false, error: "signature verification error" };
  }

  return { valid: true };
}

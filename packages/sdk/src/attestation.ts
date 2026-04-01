import type { Attestation, EffortBand, Signer } from "./types.js";
import { canonicalJSON, toUTF8Bytes, bytesToHex } from "./canonical.js";
import { contentHash } from "./content.js";

/** Input method type */
export type InputMethod = "web_keyboard" | "accessibility_observed" | "compose_in_app";

/** Parameters for building an attestation */
export interface AttestationParams {
  /** Raw message text (will be normalized and hashed) */
  messageText: string;
  /** Composite effort score (0.0 to 1.0) */
  effortScore: number;
  /** Effort band */
  effortBand: EffortBand;
  /** Composition duration in milliseconds */
  compositionDurationMs: number;
  /** How the text was input */
  inputMethod: InputMethod;
  /** Final text length (after normalization) */
  finalTextLength: number;
  /** Ed25519 public key, hex-encoded with "ed25519:" prefix */
  signerPubkey: string;
  /** Async signing function injected by platform layer */
  signer: Signer;
}

/**
 * Build a signed attestation.
 *
 * 1. Construct attestation JSON with all fields except signature
 * 2. Serialize to canonical JSON (RFC 8785)
 * 3. Sign the canonical JSON bytes with Ed25519
 * 4. Return complete attestation with signature
 */
export async function buildAttestation(
  params: AttestationParams
): Promise<Attestation> {
  const hash = await contentHash(params.messageText);

  // Round timestamp to hour precision for privacy (UTC, not local time)
  const now = new Date();
  now.setUTCMinutes(0, 0, 0);
  const timestampHour = now.toISOString();

  // Round effort score to 2 decimal places
  const roundedScore = Math.round(params.effortScore * 100) / 100;

  // Build unsigned attestation (signature placeholder)
  const unsigned: Record<string, unknown> = {
    poha_version: "0.1",
    content_hash: hash,
    effort_score: roundedScore,
    effort_band: params.effortBand,
    composition_duration_ms: params.compositionDurationMs,
    input_method: params.inputMethod,
    final_text_length: params.finalTextLength,
    timestamp_hour: timestampHour,
    signer_pubkey: params.signerPubkey,
  };

  // Canonical JSON → bytes → sign
  const canonicalBytes = toUTF8Bytes(canonicalJSON(unsigned));
  const signatureBytes = await params.signer(canonicalBytes);

  // Hex-encode signature
  const signatureHex = bytesToHex(signatureBytes);

  return {
    ...(unsigned as Omit<Attestation, "signature">),
    signature: `ed25519:${signatureHex}`,
  } as Attestation;
}

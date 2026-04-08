import type { Attestation } from "@poha/sdk";

export type { Attestation };

/** KV namespace binding for attestation storage */
export interface Env {
  ATTESTATIONS: KVNamespace;
  CALIBRATION: KVNamespace;
  PAGES: KVNamespace;
  RATE_LIMITER: DurableObjectNamespace;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

/** Valid text length buckets for calibration */
export type TextLengthBucket = "0-50" | "50-100" | "100-500" | "500+";

/** Anonymous calibration signals — no identity, no content */
export interface CalibrationSignals {
  input_method: string;
  entropy: number;
  duration_ms: number;
  paste_ratio: number;
  revision_rate: number;
  event_density: number;
  jitter: number;
  text_length_bucket: TextLengthBucket;
  locale: string;
}

/** Stored attestation in KV (attestation + metadata) */
export interface StoredAttestation {
  attestation: Attestation;
  created_at: string;
  short_id: string;
}

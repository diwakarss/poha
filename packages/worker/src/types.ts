/** KV namespace binding for attestation storage */
export interface Env {
  ATTESTATIONS: KVNamespace;
}

/** Attestation as received from the client SDK */
export interface Attestation {
  poha_version: string;
  content_hash: string;
  effort_score: number;
  effort_band: "none" | "low" | "moderate" | "high";
  composition_duration_ms: number;
  input_method: "web_keyboard" | "accessibility_observed" | "compose_in_app";
  final_text_length: number;
  timestamp_hour: string;
  signer_pubkey: string;
  signature: string;
}

/** Stored attestation in KV (attestation + metadata) */
export interface StoredAttestation {
  attestation: Attestation;
  created_at: string;
  short_id: string;
}

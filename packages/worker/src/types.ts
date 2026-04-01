import type { Attestation } from "@poha/sdk";

export type { Attestation };

/** KV namespace binding for attestation storage */
export interface Env {
  ATTESTATIONS: KVNamespace;
  RATE_LIMITER: DurableObjectNamespace;
}

/** Stored attestation in KV (attestation + metadata) */
export interface StoredAttestation {
  attestation: Attestation;
  created_at: string;
  short_id: string;
}

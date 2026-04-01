/**
 * API client for the PoHA worker.
 */

const API_BASE = import.meta.env.VITE_API_BASE || "https://api.poha.dev";

export interface AttestResponse {
  short_id: string;
  verify_url: string;
  remaining_today: number;
}

export interface AttestError {
  error: string;
}

export async function submitAttestation(
  attestation: Record<string, unknown>
): Promise<AttestResponse> {
  const res = await fetch(`${API_BASE}/attest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(attestation),
  });

  if (!res.ok) {
    const body = (await res.json()) as AttestError;
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json() as Promise<AttestResponse>;
}

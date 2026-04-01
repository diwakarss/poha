/**
 * API client for the PoHA worker.
 */

export const API_BASE = import.meta.env.VITE_API_BASE || "https://api.poha.dev";

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
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/attest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(attestation),
    });
  } catch {
    throw new Error("Could not connect to server. Please check your connection and try again.");
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as AttestError;
      if (body.error) message = body.error;
    } catch {
      // non-JSON error body, use HTTP status
    }
    throw new Error(message);
  }

  return res.json() as Promise<AttestResponse>;
}

/**
 * Canonical JSON serialization (RFC 8785 / JCS subset).
 *
 * Produces deterministic JSON:
 * - Keys sorted alphabetically (recursive)
 * - No whitespace
 * - UTF-8 encoding
 * - Numbers: IEEE 754 double serialization with no trailing zeros
 *
 * This ensures web and Android produce identical bytes for the same attestation.
 */
export function canonicalJSON(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, sortedReplacer);
}

/**
 * JSON.stringify replacer that sorts object keys alphabetically.
 */
function sortedReplacer(_key: string, value: unknown): unknown {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const sorted: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[k] = (value as Record<string, unknown>)[k];
    }
    return sorted;
  }
  return value;
}

/**
 * Encode a string to UTF-8 bytes.
 */
export function toUTF8Bytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

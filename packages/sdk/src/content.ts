/**
 * Content normalization and hashing.
 *
 * Before hashing, text is normalized to ensure identical hashes across
 * web and Android despite formatting differences:
 * 1. Trim leading/trailing whitespace
 * 2. Normalize to Unicode NFC form
 * 3. Collapse multiple consecutive newlines to double-newline
 */
import { bytesToHex } from "./canonical.js";

/**
 * Normalize text content before hashing.
 * Applied on both web (from text field value) and Android (from clipboard).
 */
export function normalizeContent(text: string): string {
  let normalized = text.trim();
  normalized = normalized.normalize("NFC");
  normalized = normalized.replace(/\n{3,}/g, "\n\n");
  return normalized;
}

/**
 * Compute SHA-256 hash of normalized text content.
 * Returns hex-encoded hash prefixed with "sha256:".
 *
 * Uses the Web Crypto API (available in browsers and modern runtimes).
 */
export async function contentHash(text: string): Promise<string> {
  const normalized = normalizeContent(text);
  const bytes = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  const hex = bytesToHex(new Uint8Array(hashBuffer));
  return `sha256:${hex}`;
}

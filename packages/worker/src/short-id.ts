/**
 * Generate a 5-character alphanumeric short ID.
 * Uses crypto.getRandomValues with rejection sampling for uniform distribution.
 * Character set: [A-Za-z0-9] = 62 chars, 5 chars = ~916M combinations.
 */
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const ID_LENGTH = 5;

// Largest multiple of 62 that fits in a byte: 62 * 4 = 248
const MAX_VALID = 247; // bytes 0-247 map uniformly to 0-61

export function generateShortId(): string {
  let id = "";
  while (id.length < ID_LENGTH) {
    // Generate extra bytes to minimize re-rolls (rejection rate ~3.1%)
    const bytes = new Uint8Array(ID_LENGTH - id.length + 2);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < bytes.length && id.length < ID_LENGTH; i++) {
      if (bytes[i] <= MAX_VALID) {
        id += ALPHABET[bytes[i] % ALPHABET.length];
      }
    }
  }
  return id;
}

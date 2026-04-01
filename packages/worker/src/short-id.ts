/**
 * Generate a 5-character alphanumeric short ID.
 * Uses crypto.getRandomValues for strong randomness.
 * Character set: [A-Za-z0-9] = 62 chars, 5 chars = ~916M combinations.
 */
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const ID_LENGTH = 5;

export function generateShortId(): string {
  const bytes = new Uint8Array(ID_LENGTH);
  crypto.getRandomValues(bytes);
  let id = "";
  for (let i = 0; i < ID_LENGTH; i++) {
    id += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return id;
}

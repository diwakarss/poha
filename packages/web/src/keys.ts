/**
 * Ed25519 key management via IndexedDB.
 * Generates a keypair on first use, persists it for future sessions.
 */
import * as ed from "@noble/ed25519";
import { get, set } from "idb-keyval";

const PRIVKEY_KEY = "poha_ed25519_privkey";
const PUBKEY_KEY = "poha_ed25519_pubkey";

export interface KeyPair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  publicKeyHex: string;
}

let cached: KeyPair | null = null;

/**
 * Get or generate the Ed25519 keypair.
 * Stored in IndexedDB, cached in memory for the session.
 */
export async function getKeyPair(): Promise<KeyPair> {
  if (cached) return cached;

  // Try loading from IndexedDB
  const storedPriv = await get<Uint8Array>(PRIVKEY_KEY);
  const storedPub = await get<Uint8Array>(PUBKEY_KEY);

  if (storedPriv && storedPub) {
    cached = {
      privateKey: storedPriv,
      publicKey: storedPub,
      publicKeyHex: bytesToHex(storedPub),
    };
    return cached;
  }

  // Generate new keypair
  const privateKey = ed.utils.randomPrivateKey();
  const publicKey = await ed.getPublicKeyAsync(privateKey);

  await set(PRIVKEY_KEY, privateKey);
  await set(PUBKEY_KEY, publicKey);

  cached = {
    privateKey,
    publicKey,
    publicKeyHex: bytesToHex(publicKey),
  };
  return cached;
}

/**
 * Sign bytes with the stored private key.
 * This is the Signer implementation for the SDK.
 */
export async function sign(bytes: Uint8Array): Promise<Uint8Array> {
  const kp = await getKeyPair();
  return ed.signAsync(bytes, kp.privateKey);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

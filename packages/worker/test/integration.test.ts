import { describe, expect, test } from "bun:test";
import { validateAttestation } from "../src/validate.js";
import { buildAttestation, bytesToHex } from "@poha/sdk";
import type { Attestation } from "../src/types.js";
import * as ed from "@noble/ed25519";

/**
 * Cross-package integration test: SDK builds attestation → Worker validates it.
 * This catches drift in canonical JSON, signing, or attestation format between packages.
 */
describe("SDK → Worker integration", () => {
  async function makeKeypair() {
    const privateKey = ed.utils.randomPrivateKey();
    const publicKey = await ed.getPublicKeyAsync(privateKey);
    const publicKeyHex = bytesToHex(publicKey);
    return { privateKey, publicKey, publicKeyHex };
  }

  test("attestation built by SDK passes worker validation", async () => {
    const kp = await makeKeypair();

    const attestation = await buildAttestation({
      messageText: "Hello, this is a test message written by a human.",
      effortScore: 0.75,
      effortBand: "high",
      compositionDurationMs: 60000,
      inputMethod: "web_keyboard",
      finalTextLength: 49,
      signerPubkey: `ed25519:${kp.publicKeyHex}`,
      signer: async (bytes: Uint8Array) => ed.signAsync(bytes, kp.privateKey),
    });

    const result = await validateAttestation(attestation as unknown as Attestation);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test("attestation with moderate effort passes validation", async () => {
    const kp = await makeKeypair();

    const attestation = await buildAttestation({
      messageText: "A moderate effort message.",
      effortScore: 0.55,
      effortBand: "moderate",
      compositionDurationMs: 30000,
      inputMethod: "web_keyboard",
      finalTextLength: 26,
      signerPubkey: `ed25519:${kp.publicKeyHex}`,
      signer: async (bytes: Uint8Array) => ed.signAsync(bytes, kp.privateKey),
    });

    const result = await validateAttestation(attestation as unknown as Attestation);
    expect(result.valid).toBe(true);
  });

  test("attestation with low effort passes validation", async () => {
    const kp = await makeKeypair();

    const attestation = await buildAttestation({
      messageText: "Short.",
      effortScore: 0.2,
      effortBand: "low",
      compositionDurationMs: 5000,
      inputMethod: "web_keyboard",
      finalTextLength: 6,
      signerPubkey: `ed25519:${kp.publicKeyHex}`,
      signer: async (bytes: Uint8Array) => ed.signAsync(bytes, kp.privateKey),
    });

    const result = await validateAttestation(attestation as unknown as Attestation);
    expect(result.valid).toBe(true);
  });

  test("tampered attestation fails validation", async () => {
    const kp = await makeKeypair();

    const attestation = await buildAttestation({
      messageText: "Original message.",
      effortScore: 0.8,
      effortBand: "high",
      compositionDurationMs: 45000,
      inputMethod: "web_keyboard",
      finalTextLength: 17,
      signerPubkey: `ed25519:${kp.publicKeyHex}`,
      signer: async (bytes: Uint8Array) => ed.signAsync(bytes, kp.privateKey),
    });

    // Tamper with the effort score
    const tampered = { ...attestation, effort_score: 0.99 } as unknown as Attestation;
    const result = await validateAttestation(tampered);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("signature verification failed");
  });

  test("attestation signed with wrong key fails validation", async () => {
    const kp = await makeKeypair();
    const wrongKp = await makeKeypair();

    const attestation = await buildAttestation({
      messageText: "Signed with wrong key.",
      effortScore: 0.6,
      effortBand: "moderate",
      compositionDurationMs: 20000,
      inputMethod: "web_keyboard",
      finalTextLength: 22,
      signerPubkey: `ed25519:${kp.publicKeyHex}`, // claims kp
      signer: async (bytes: Uint8Array) => ed.signAsync(bytes, wrongKp.privateKey), // signs with wrongKp
    });

    const result = await validateAttestation(attestation as unknown as Attestation);
    expect(result.valid).toBe(false);
  });

  test("all input methods pass validation", async () => {
    const kp = await makeKeypair();
    const methods = ["web_keyboard", "accessibility_observed", "compose_in_app"] as const;

    for (const method of methods) {
      const attestation = await buildAttestation({
        messageText: `Testing ${method}`,
        effortScore: 0.5,
        effortBand: "moderate",
        compositionDurationMs: 10000,
        inputMethod: method,
        finalTextLength: 20,
        signerPubkey: `ed25519:${kp.publicKeyHex}`,
        signer: async (bytes: Uint8Array) => ed.signAsync(bytes, kp.privateKey),
      });

      const result = await validateAttestation(attestation as unknown as Attestation);
      expect(result.valid).toBe(true);
    }
  });
});

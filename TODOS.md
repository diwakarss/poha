# TODOS

## v2: Multi-device / key migration
**What:** When a user gets a new phone or clears browser data, their Ed25519 keypair is lost. Future badges come from a new key with no link to previous identity. Need a key linking / migration mechanism so users don't lose their badge history when switching devices.
**Why:** For a social signal product, identity continuity matters. "Is this the same person who posted before?" breaks without key linking.
**Depends on:** Key rotation (also v2). Multi-device is a superset of key rotation.
**Context:** Design doc defers key rotation to v2. This TODO captures the broader problem. Possible approaches: key backup via passphrase-encrypted export, cross-device key transfer via QR code, or a key linking attestation that chains old → new pubkey.

## DONE: Full DESIGN.md via /design-consultation
Completed 2026-04-01. DESIGN.md written with full palette (20 color variables), Satoshi display font, type scale, spacing scale, motion tokens, voice/copy guidelines, accessibility specs.

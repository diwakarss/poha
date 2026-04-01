# TODOS

## Eng Review Findings (2026-04-01)

### P0 — Fix now

- [ ] **A-1: Wire @poha/sdk as dependency in web app** — Remove 135 inlined lines from `app.tsx`, import from SDK package. Prevents drift between SDK and web scoring logic.
- [ ] **A-2: Share canonicalJSON between SDK and Worker** — Worker `validate.ts` has a duplicated canonical JSON implementation. Import from `@poha/sdk` instead.
- [ ] **CQ-1: Fix modulo bias in short-id.ts** — `bytes[i] % 62` favors first 8 characters by ~3.2%. Use rejection sampling.
- [ ] **T-5: Cross-package integration test** — SDK builds attestation → Worker validates it. Round-trip test catches canonical JSON drift.

### P1 — Before shipping to real users

- [ ] **A-3: Lock CORS to poha.dev / poha.ink** — Current wildcard `*` allows any site to POST attestations.
- [ ] **T-1: Add tests for rate-limit.ts** — Security boundary with zero test coverage.
- [ ] **T-2: Add tests for worker/index.ts** — No routing, CORS, or integration tests for the main handler.
- [ ] **P-1+P-2: Debounce score recalculation** — Events array copied O(n) per keystroke + score recomputed every keystroke. Use ref + debounce.

### P2 — Before scale

- [ ] **A-4: Durable Objects for atomic rate limiting** — KV check-then-increment is non-atomic. Concurrent requests can bypass the 100/day limit.
- [ ] **T-3: Basic web package tests** — collector.ts and keys.ts have testable logic. Zero coverage currently.
- [ ] **CQ-2: Import Attestation type from SDK in Worker** — Duplicated type definition risks silent drift.

### P3 — Nice to have

- [ ] **CQ-4: Remove unsafe-inline from CSP style-src** — Move to hashed/nonced styles.
- [ ] **CQ-5: Normalize pasteRatio through normalizeLinear** — Inconsistency with other signals.
- [ ] **CQ-8: Validate hex string length in hexToBytes** — Odd-length hex silently produces garbage.
- [ ] **T-4: Score/band boundary tests** — Verify SDK and Worker agree at exactly 0.1, 0.4, 0.7.

## v2: Multi-device / key migration
**What:** When a user gets a new phone or clears browser data, their Ed25519 keypair is lost. Future badges come from a new key with no link to previous identity. Need a key linking / migration mechanism so users don't lose their badge history when switching devices.
**Why:** For a social signal product, identity continuity matters. "Is this the same person who posted before?" breaks without key linking.
**Depends on:** Key rotation (also v2). Multi-device is a superset of key rotation.
**Context:** Design doc defers key rotation to v2. This TODO captures the broader problem. Possible approaches: key backup via passphrase-encrypted export, cross-device key transfer via QR code, or a key linking attestation that chains old → new pubkey.

## DONE: Full DESIGN.md via /design-consultation
Completed 2026-04-01. DESIGN.md written with full palette (20 color variables), Satoshi display font, type scale, spacing scale, motion tokens, voice/copy guidelines, accessibility specs.

# TODOS

## Eng Review Findings (2026-04-01)

### P0 — Fix now (DONE)

- [x] **A-1: Wire @poha/sdk as dependency in web app** — Removed 135 inlined lines from `app.tsx`.
- [x] **A-2: Share canonicalJSON between SDK and Worker** — Worker imports from `@poha/sdk`.
- [x] **CQ-1: Fix modulo bias in short-id.ts** — Rejection sampling for uniform distribution.
- [x] **T-5: Cross-package integration test** — 6 round-trip tests (SDK build → Worker validate).

### P1 — Before shipping to real users (DONE)

- [x] **A-3: Lock CORS to poha.dev / poha.ink** — Origin-aware CORS with Vary header.
- [x] **T-1: Add tests for rate-limit.ts** — 5 tests covering limits, independence, TTL.
- [x] **T-2: Add tests for worker/index.ts** — 13 tests for routing, CORS, API endpoints.
- [x] **P-1+P-2: Debounce score recalculation** — Mutable ref + 300ms debounce.

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

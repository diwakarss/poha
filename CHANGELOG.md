# Changelog

All notable changes to PoHA will be documented in this file.

## [0.1.0.1] - 2026-04-01

### Fixed
- **@poha/sdk**: Timestamp rounding now uses UTC (setUTCMinutes) instead of local time. Users in half-hour timezones (India UTC+5:30, Nepal UTC+5:45) were producing :30/:45 minute timestamps that the worker rejected.
- **@poha/worker**: String type guards added to validateAttestation. Non-string fields (e.g. signer_pubkey as object) no longer crash the worker with uncaught TypeError.
- **@poha/worker**: validateAttestation call wrapped in try/catch for defense-in-depth against malformed input.
- 162 tests (was 158), including type confusion and timezone regression tests.

## [0.1.0.0] - 2026-04-01

### Added
- **@poha/sdk**: Signal engine with IKI histogram, Shannon entropy, composite scoring, and effort banding. Ed25519 attestation builder with canonical JSON signing. Content normalization and hashing.
- **@poha/worker**: Cloudflare Worker with POST /attest (validate + store), GET /v/:id (HTML verification page), GET /api/:id (raw JSON). Rate limiting via Durable Objects (100/day per pubkey). Short ID generation with rejection sampling for uniform distribution.
- **@poha/web**: Preact compose app with real-time typing signal collection, debounced score display, badge creation flow, and clipboard copy with fallback. Strict CSP. Ed25519 key generation stored in IndexedDB.
- 158 tests across SDK (77), Worker (50+), and Web (10) covering all code paths including boundary conditions, cross-package integration, and adversarial validation inputs.
- CORS locked to poha.dev and poha.ink origins with Vary header.
- Input validation: Ed25519 key/signature length bounds, numeric field upper bounds, null body rejection, timestamp freshness checks.

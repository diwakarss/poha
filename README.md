# PoHA — Proof of Human Attention

AI writes like you now. This badge shows when you wrote it yourself.

```
Spent the morning debugging a race condition that
only shows up under load. Turned out to be a missing
mutex on the session cache. Three hours for one line.

✍️ Human-typed · poha.ink/iYraB
```

PoHA measures your typing behavior — keystroke timing, pauses, revisions, paste events — without reading what you type. If enough human effort is detected, you get a badge: a short link anyone can tap to verify.

## Try it

**Chrome Extension** → [Install from Chrome Web Store](https://chromewebstore.google.com/detail/poha-%E2%80%94-proof-of-human-att/hgfnfkpfplkoplgafagfnpogedpgpllf)

**Web App** → [web.poha.ink](https://web.poha.ink) (badge any message in <10 seconds)

**Verify a badge:** `poha.ink/{id}`

## Coming soon

- [Chrome Extension](https://chromewebstore.google.com/detail/poha-%E2%80%94-proof-of-human-att/hgfnfkpfplkoplgafagfnpogedpgpllf) — live
- Android keyboard app (June 2026)
- iOS app (July 2026)

## Install

```bash
npm install @poha/sdk
```

```typescript
import {
  extractSignals,
  computeScore,
  buildAttestation,
  TypingSession,
} from "@poha/sdk";
```

## Packages

| Package | What it does | License |
|---|---|---|
| `packages/sdk` | Signal engine, scoring, attestation builder | MIT |
| `packages/worker` | Cloudflare Worker — API, verification pages, landing page | MIT |

Everything in this repo is MIT licensed.

## Scoring

Six signals, weighted sum, normalized to [0, 1]:

| Signal | Weight | Measures |
|---|---|---|
| Keystroke entropy | 20% | Variety in typing rhythm |
| Paste ratio | 20% | Pasted vs typed (less paste = higher) |
| Duration | 20% | Time composing (3s–180s) |
| Revision rate | 15% | Edits per 100 chars |
| Event density | 15% | Keystrokes per second |
| Jitter regularity | 10% | Detects scripted vs human typing rhythm |

Bands: `none` (< 0.1), `low` (0.1–0.3), `moderate` (0.3–0.6), `high` (0.6+). Badge requires 0.3+.

## Run locally

```bash
bun install

# Worker (localhost:8787)
cd packages/worker && bun run dev

# Tests
bun test
```

## Deploy

```bash
# Worker → poha.ink
cd packages/worker && npx wrangler deploy
```

## Docs

- [Whitepaper](./WHITEPAPER.md) — what PoHA measures, how it scores, where it breaks

## Contributing

PRs, issues, and attack papers welcome.

Built by [@1nimit](https://x.com/1nimit).

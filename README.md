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

**Badge a message:** [web.poha.ink](https://web.poha.ink)
**Verify a badge:** `poha.ink/{id}`

## Coming soon

- Chrome Extension
- Android App
- iOS App

## Packages

| Package | What it does | License |
|---|---|---|
| `packages/sdk` | Signal engine, scoring, attestation builder | MIT |
| `packages/worker` | Cloudflare Worker — API, verification pages, landing page | MIT |

Everything in this repo is MIT licensed.

## Scoring

Five signals, weighted sum, normalized to [0, 1]:

| Signal | Weight | Measures |
|---|---|---|
| Keystroke entropy | 25% | Variety in typing rhythm |
| Paste ratio | 20% | Pasted vs typed (less paste = higher) |
| Duration | 20% | Time composing (3s–180s) |
| Revision rate | 20% | Edits per 100 chars |
| Event density | 15% | Keystrokes per second |

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
- [Design system](./DESIGN.md) — colors, typography, spacing, components

## Contributing

PRs, issues, and attack papers welcome.

Built by [@1nimit](https://x.com/1nimit).

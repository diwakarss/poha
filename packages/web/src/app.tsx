import { useState, useRef, useEffect, useCallback } from "preact/hooks";
import type { FunctionComponent } from "preact";
import { attachCollector } from "./collector";
import { getKeyPair, sign } from "./keys";
import { submitAttestation } from "./api";
import type { InputEvent } from "./collector";

/**
 * Inline SDK functions to avoid cross-package import issues with Vite.
 * These mirror the @poha/sdk implementations exactly.
 */

// --- histogram ---
const IKI_BIN_COUNT = 100;
const IKI_BIN_WIDTH_MS = 50;

function buildIKIHistogram(events: InputEvent[]): Float64Array {
  const histogram = new Float64Array(IKI_BIN_COUNT);
  const typing = events.filter((e) => e.type === "keydown" && e.charCountDelta > 0);
  for (let i = 1; i < typing.length; i++) {
    const iki = typing[i].timestamp - typing[i - 1].timestamp;
    const bin = Math.min(IKI_BIN_COUNT - 1, Math.floor(Math.max(0, iki) / IKI_BIN_WIDTH_MS));
    histogram[bin]++;
  }
  return histogram;
}

// --- entropy ---
function shannonEntropy(histogram: Float64Array): number {
  let total = 0;
  for (let i = 0; i < histogram.length; i++) total += histogram[i];
  if (total === 0) return 0;
  let entropy = 0;
  for (let i = 0; i < histogram.length; i++) {
    if (histogram[i] > 0) {
      const p = histogram[i] / total;
      entropy -= p * Math.log2(p);
    }
  }
  return entropy;
}

// --- signals ---
interface RawSignals {
  durationMs: number;
  entropy: number;
  pasteRatio: number;
  revisionRate: number;
  eventDensity: number;
}

function extractSignals(events: InputEvent[]): RawSignals {
  if (events.length === 0) {
    return { durationMs: 0, entropy: 0, pasteRatio: 0, revisionRate: 0, eventDensity: 0 };
  }
  const first = events[0].timestamp;
  const last = events[events.length - 1].timestamp;
  const durationMs = last - first;
  const histogram = buildIKIHistogram(events);
  const entropyVal = shannonEntropy(histogram);

  let pastedChars = 0;
  let typedChars = 0;
  let removedChars = 0;
  for (const e of events) {
    if (e.type === "paste" && e.charCountDelta > 0) pastedChars += e.charCountDelta;
    if (e.type === "keydown" && e.charCountDelta > 0) typedChars += e.charCountDelta;
    if (e.charCountDelta < 0) removedChars += Math.abs(e.charCountDelta);
  }
  const totalChars = pastedChars + typedChars;
  const pasteRatio = totalChars > 0 ? pastedChars / totalChars : 0;
  const revisionRate = typedChars > 0 ? (removedChars / typedChars) * 100 : 0;
  const keydowns = events.filter((e) => e.type === "keydown").length;
  const durationSec = durationMs / 1000;
  const eventDensity = durationSec > 0 ? keydowns / durationSec : 0;

  return { durationMs, entropy: entropyVal, pasteRatio, revisionRate, eventDensity };
}

// --- score ---
const DEFAULT_SIGNAL_CONFIG: Record<string, { weight: number; min: number; max: number }> = {
  duration: { weight: 0.25, min: 5_000, max: 180_000 },
  entropy: { weight: 0.30, min: 0.5, max: 3.5 },
  pasteRatio: { weight: 0.20, min: 0, max: 1 },
  revisionRate: { weight: 0.15, min: 0, max: 10 },
  eventDensity: { weight: 0.10, min: 0.5, max: 3.0 },
};

type EffortBand = "none" | "low" | "moderate" | "high";

const EFFORT_THRESHOLDS = { none: 0.0, low: 0.1, moderate: 0.4, high: 0.7 };

function computeScore(raw: RawSignals) {
  const normalized: Record<string, number> = {
    duration: clamp((raw.durationMs - 5000) / (180000 - 5000)),
    entropy: clamp((raw.entropy - 0.5) / (3.5 - 0.5)),
    pasteRatio: 1.0 - raw.pasteRatio,
    revisionRate: clamp((raw.revisionRate - 0) / (10 - 0)),
    eventDensity: clamp((raw.eventDensity - 0.5) / (3.0 - 0.5)),
  };

  let score = 0;
  for (const [key, cfg] of Object.entries(DEFAULT_SIGNAL_CONFIG)) {
    score += (normalized[key] ?? 0) * cfg.weight;
  }
  score = clamp(score);

  let band: EffortBand = "none";
  if (score >= EFFORT_THRESHOLDS.high) band = "high";
  else if (score >= EFFORT_THRESHOLDS.moderate) band = "moderate";
  else if (score >= EFFORT_THRESHOLDS.low) band = "low";

  return { score, band, signals: normalized };
}

function clamp(v: number) {
  return Math.min(1, Math.max(0, v));
}

// --- content ---
function normalizeContent(text: string): string {
  let s = text.trim().normalize("NFC");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s;
}

async function contentHash(text: string): Promise<string> {
  const normalized = normalizeContent(text);
  const bytes = new TextEncoder().encode(normalized);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `sha256:${hex}`;
}

// --- canonical JSON ---
function canonicalJSON(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, (_key, value) => {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(value as Record<string, unknown>).sort()) {
        sorted[k] = (value as Record<string, unknown>)[k];
      }
      return sorted;
    }
    return value;
  });
}

// --- State machine ---
type AppState = "composing" | "badging" | "success" | "error";

interface SuccessData {
  shortId: string;
  verifyUrl: string;
}

const BADGE_READY_THRESHOLD = 0.4;

const App: FunctionComponent = () => {
  const [state, setState] = useState<AppState>("composing");
  const [text, setText] = useState("");
  const [events, setEvents] = useState<InputEvent[]>([]);
  const [score, setScore] = useState(0);
  const [band, setBand] = useState<EffortBand>("none");
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showBanner, setShowBanner] = useState(() => !localStorage.getItem("poha_banner_dismissed"));
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Attach collector
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    const cleanup = attachCollector(ta, (event) => {
      setEvents((prev) => [...prev, event]);
    });

    return cleanup;
  }, []);

  // Recompute score on events change
  useEffect(() => {
    if (events.length < 2) {
      setScore(0);
      setBand("none");
      return;
    }
    const raw = extractSignals(events);
    const result = computeScore(raw);
    setScore(result.score);
    setBand(result.band);
  }, [events]);

  const isReady = score >= BADGE_READY_THRESHOLD && text.trim().length > 0;

  const handleBadge = useCallback(async () => {
    if (!isReady || state !== "composing") return;
    setState("badging");
    setErrorMsg("");

    try {
      const kp = await getKeyPair();
      const hash = await contentHash(text);
      const raw = extractSignals(events);
      const result = computeScore(raw);

      const now = new Date();
      now.setMinutes(0, 0, 0);

      const unsigned: Record<string, unknown> = {
        poha_version: "0.1",
        content_hash: hash,
        effort_score: Math.round(result.score * 100) / 100,
        effort_band: result.band,
        composition_duration_ms: raw.durationMs,
        input_method: "web_keyboard",
        final_text_length: normalizeContent(text).length,
        timestamp_hour: now.toISOString(),
        signer_pubkey: `ed25519:${kp.publicKeyHex}`,
      };

      const signingInput = new TextEncoder().encode(canonicalJSON(unsigned));
      const sigBytes = await sign(signingInput);
      const sigHex = Array.from(sigBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const attestation = {
        ...unsigned,
        signature: `ed25519:${sigHex}`,
      };

      const response = await submitAttestation(attestation);
      setSuccessData({
        shortId: response.short_id,
        verifyUrl: response.verify_url,
      });
      setState("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create badge");
      setState("error");
      // Auto-recover to composing after 3 seconds
      setTimeout(() => setState("composing"), 3000);
    }
  }, [isReady, state, text, events]);

  const handleReset = useCallback(() => {
    setText("");
    setEvents([]);
    setScore(0);
    setBand("none");
    setSuccessData(null);
    setErrorMsg("");
    setState("composing");
    setCopied(false);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!successData) return;
    const fullUrl = `${window.location.origin}${successData.verifyUrl}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  }, [successData]);

  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem("poha_banner_dismissed", "1");
  }, []);

  const bandColor = band === "high" ? "var(--effort-high)"
    : band === "moderate" ? "var(--effort-moderate)"
    : band === "low" ? "var(--effort-low)"
    : "var(--effort-none)";

  return (
    <>
      <div class="header">
        <svg class="header-shield" viewBox="0 0 24 24">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.83-3.4 9.36-7 10.5-3.6-1.14-7-5.67-7-10.5V6.3l7-3.12z" />
        </svg>
        <h1>PoHA</h1>
      </div>

      {showBanner && (
        <div class="banner">
          <button class="banner-dismiss" onClick={dismissBanner} aria-label="Dismiss">
            &times;
          </button>
          Type your message below. PoHA measures your typing rhythm to prove you wrote it by hand.
          When enough effort is detected, you can badge your message with a verification link.
        </div>
      )}

      {state === "success" && successData ? (
        <div class="success-card">
          <h2>Badged</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
            Your message has been attested as human-authored.
          </p>
          <span class="badge-link">{successData.verifyUrl}</span>
          <button class="copy-btn" onClick={handleCopy}>
            {copied ? "Copied" : "Copy verification link"}
          </button>
          <button class="new-btn" onClick={handleReset}>
            Write another message
          </button>
        </div>
      ) : (
        <div class="compose">
          <textarea
            ref={textareaRef}
            value={text}
            onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
            placeholder="Type your message here..."
            disabled={state === "badging"}
            aria-label="Compose message"
          />

          <div class="effort-bar">
            <div class="effort-track">
              <div
                class="effort-fill"
                style={{
                  width: `${Math.round(score * 100)}%`,
                  backgroundColor: bandColor,
                }}
              />
            </div>
            <span class="effort-label" style={{ color: bandColor }}>
              {band === "none" ? "—" : band}
            </span>
          </div>

          <button
            class={`badge-btn ${isReady ? "ready" : ""}`}
            disabled={!isReady || state === "badging"}
            onClick={handleBadge}
          >
            {state === "badging" ? (
              <>
                <span class="spinner" />
                Creating badge...
              </>
            ) : isReady ? (
              "Badge this message"
            ) : (
              "Keep typing to badge"
            )}
          </button>

          {state === "error" && errorMsg && (
            <div class="error-toast">{errorMsg}</div>
          )}
        </div>
      )}

      <div class="footer">
        Proof of Human Authorship v0.1
      </div>
    </>
  );
};

export default App;

import { useState, useRef, useEffect, useCallback } from "preact/hooks";
import type { FunctionComponent } from "preact";
import { attachCollector } from "./collector";
import { getKeyPair, sign } from "./keys";
import { submitAttestation, API_BASE } from "./api";

/** Short domain for the badge line — human-readable, not the API host */
const BADGE_DOMAIN = import.meta.env.VITE_BADGE_DOMAIN || "poha.ink";
import type { InputEvent } from "./collector";
import {
  extractSignals,
  computeScore,
  normalizeContent,
  buildAttestation,
  BADGE_READY_THRESHOLD,
} from "@poha/sdk";
import type { EffortBand } from "@poha/sdk";

// --- State machine ---
type AppState = "composing" | "badging" | "success" | "error";

interface SuccessData {
  shortId: string;
  verifyUrl: string;
  badgeUrl: string;
}

const SCORE_DEBOUNCE_MS = 300;

const effortLabel = (band: EffortBand): string => {
  switch (band) {
    case "none": return "Start typing";
    case "low": return "Start typing";
    case "moderate": return "Building effort...";
    case "high": return "Ready to badge";
  }
};

const App: FunctionComponent = () => {
  const [state, setState] = useState<AppState>("composing");
  const [text, setText] = useState("");
  const [score, setScore] = useState(0);
  const [band, setBand] = useState<EffortBand>("none");
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showBanner, setShowBanner] = useState(() => !localStorage.getItem("poha_banner_dismissed"));
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const eventsRef = useRef<InputEvent[]>([]);
  const scoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced score recalculation
  const recalcScore = useCallback(() => {
    const events = eventsRef.current;
    if (events.length < 2) {
      setScore(0);
      setBand("none");
      return;
    }
    const raw = extractSignals(events);
    const result = computeScore(raw);
    setScore(result.score);
    setBand(result.band);
  }, []);

  // Attach collector — re-runs when textarea remounts (state changes between success/composing)
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    const cleanup = attachCollector(ta, (event) => {
      eventsRef.current.push(event);
      if (scoreTimerRef.current) clearTimeout(scoreTimerRef.current);
      scoreTimerRef.current = setTimeout(recalcScore, SCORE_DEBOUNCE_MS);
    });

    return () => {
      cleanup();
      if (scoreTimerRef.current) clearTimeout(scoreTimerRef.current);
    };
  }, [recalcScore, state]);

  const isReady = score >= BADGE_READY_THRESHOLD && text.trim().length > 0;

  const handleBadge = useCallback(async () => {
    if (!isReady || state !== "composing") return;
    setState("badging");
    setErrorMsg("");

    try {
      const kp = await getKeyPair();
      const raw = extractSignals(eventsRef.current);
      const result = computeScore(raw);

      const attestation = await buildAttestation({
        messageText: text,
        effortScore: result.score,
        effortBand: result.band,
        compositionDurationMs: raw.durationMs,
        inputMethod: "web_keyboard",
        finalTextLength: normalizeContent(text).length,
        signerPubkey: `ed25519:${kp.publicKeyHex}`,
        signer: sign,
      });

      const response = await submitAttestation(attestation);
      const verifyUrl = `${API_BASE}${response.verify_url}`;
      const badgeUrl = `${BADGE_DOMAIN}/${response.short_id}`;
      setSuccessData({
        shortId: response.short_id,
        verifyUrl,
        badgeUrl,
      });
      // Auto-copy message + badge line to clipboard
      const badgedText = `${text}\n\n\u270D\uFE0F Human-typed \u00B7 ${badgeUrl}`;
      try {
        await navigator.clipboard.writeText(badgedText);
        setCopied(true);
      } catch {
        // Will show manual copy button
      }
      setState("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create badge");
      setState("error");
      setTimeout(() => setState("composing"), 3000);
    }
  }, [isReady, state, text]);

  const handleReset = useCallback(() => {
    setText("");
    eventsRef.current = [];
    setScore(0);
    setBand("none");
    setSuccessData(null);
    setErrorMsg("");
    setState("composing");
    setCopied(false);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!successData) return;
    const badgedText = `${text}\n\n\u270D\uFE0F Human-typed \u00B7 ${successData.badgeUrl}`;
    try {
      await navigator.clipboard.writeText(badgedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this:", badgedText);
    }
  }, [successData, text]);

  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem("poha_banner_dismissed", "1");
  }, []);

  const pillClass = band === "high" ? "effort-high"
    : band === "moderate" ? "effort-moderate"
    : "effort-none";

  return (
    <>
      <div class="header">
        <h1>PoHA</h1>
        <span class="header-tagline">Prove you typed it</span>
      </div>

      {showBanner && (
        <div class="banner">
          <span>Type a message. We'll measure your typing effort and give you a badge proving you wrote it.</span>
          <button class="banner-dismiss" onClick={dismissBanner}>Got it</button>
        </div>
      )}

      {state === "success" && successData ? (
        <div class="success-card">
          <h2>Badged</h2>
          <p class="success-message">{text}</p>
          <span class="badge-link">{"\u270D\uFE0F"} Human-typed {"\u00B7"} {successData.badgeUrl}</span>
          {copied && <p class="copied-note">Copied to clipboard</p>}
          <div class="success-actions">
            <button class={`copy-btn ${copied ? "copied" : ""}`} onClick={handleCopy}>
              {copied ? "Copied!" : "Copy with badge"}
            </button>
            <button class="new-btn" onClick={handleReset}>
              Write another message
            </button>
          </div>
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

          <div class="compose-footer">
            <div class={`effort-pill ${pillClass}`} aria-live="polite">
              <span class="dot" />
              {effortLabel(band)}
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
                "Copy with badge"
              ) : (
                "Keep typing..."
              )}
            </button>
          </div>

          {state === "error" && errorMsg && (
            <div class="error-toast">{errorMsg}</div>
          )}
        </div>
      )}

      <div class="footer">
        Proof of Human Attention v0.1
      </div>
    </>
  );
};

export default App;

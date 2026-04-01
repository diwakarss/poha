import type { StoredAttestation } from "./types.js";

/**
 * Render the HTML verification page.
 * No JS, mobile-friendly, dark bg, shield with typing rhythm.
 * Per DESIGN.md: Industrial/Utilitarian, Satoshi display, trust signaling.
 */
export function renderVerifyPage(stored: StoredAttestation): string {
  const att = stored.attestation;
  const createdDate = new Date(stored.created_at);
  const formattedDate = createdDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = createdDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const bandColor = getBandColor(att.effort_band);
  const bandLabel = att.effort_band.charAt(0).toUpperCase() + att.effort_band.slice(1);
  const durationStr = formatDuration(att.composition_duration_ms);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PoHA Verification – ${stored.short_id}</title>
  <meta name="description" content="Proof of Human Authorship verification for badge ${stored.short_id}">
  <style>
    @font-face {
      font-family: 'Satoshi';
      src: url('https://cdn.jsdelivr.net/gh/fontshare/fonts@main/Satoshi/Satoshi-Bold.woff2') format('woff2');
      font-weight: 700;
      font-display: swap;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #111111;
      color: #e0e0e0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px;
    }
    .container {
      max-width: 480px;
      width: 100%;
    }
    .shield {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 32px;
    }
    .shield-icon {
      width: 48px;
      height: 48px;
      border: 2px solid ${bandColor};
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .shield-icon svg {
      width: 28px;
      height: 28px;
      fill: ${bandColor};
    }
    .shield-title {
      font-family: 'Satoshi', system-ui, sans-serif;
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
    }
    .badge-id {
      text-align: center;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 14px;
      color: #888888;
      margin-bottom: 24px;
    }
    .status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 20px;
      background: ${bandColor}14;
      border: 1px solid ${bandColor}33;
      border-radius: 8px;
      margin-bottom: 32px;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${bandColor};
    }
    .status-text {
      font-size: 14px;
      font-weight: 600;
      color: ${bandColor};
    }
    .details {
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      overflow: hidden;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid #2a2a2a;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-size: 13px;
      color: #888888;
    }
    .detail-value {
      font-size: 13px;
      color: #e0e0e0;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      text-align: right;
      max-width: 60%;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .effort-bar {
      width: 100px;
      height: 4px;
      background: #2a2a2a;
      border-radius: 2px;
      overflow: hidden;
      display: inline-block;
      vertical-align: middle;
      margin-left: 8px;
    }
    .effort-fill {
      height: 100%;
      background: ${bandColor};
      border-radius: 2px;
      width: ${Math.round(att.effort_score * 100)}%;
    }
    .hash-section {
      margin-top: 24px;
      padding: 16px;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
    }
    .hash-label {
      font-size: 12px;
      color: #888888;
      margin-bottom: 8px;
    }
    .hash-value {
      font-size: 11px;
      color: #666666;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      word-break: break-all;
      line-height: 1.5;
    }
    .footer {
      margin-top: 32px;
      text-align: center;
      font-size: 12px;
      color: #555555;
    }
    .footer a {
      color: #888888;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="shield">
      <div class="shield-icon">
        <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.83-3.4 9.36-7 10.5-3.6-1.14-7-5.67-7-10.5V6.3l7-3.12z"/></svg>
      </div>
      <span class="shield-title">Typed by Hand</span>
    </div>

    <div class="badge-id">Badge ${stored.short_id}</div>

    <div class="status">
      <span class="status-dot"></span>
      <span class="status-text">${bandLabel} Effort Detected</span>
    </div>

    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Effort Score</span>
        <span class="detail-value">
          ${att.effort_score.toFixed(2)}
          <span class="effort-bar"><span class="effort-fill"></span></span>
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Composition Time</span>
        <span class="detail-value">${durationStr}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Text Length</span>
        <span class="detail-value">${att.final_text_length.toLocaleString()} chars</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Input Method</span>
        <span class="detail-value">${formatInputMethod(att.input_method)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Attested</span>
        <span class="detail-value">${formattedDate}</span>
      </div>
    </div>

    <div class="hash-section">
      <div class="hash-label">Content Hash</div>
      <div class="hash-value">${att.content_hash}</div>
      <div class="hash-label" style="margin-top: 12px;">Signer</div>
      <div class="hash-value">${att.signer_pubkey}</div>
    </div>

    <div class="footer">
      <p>Proof of Human Authorship v${att.poha_version}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Render a 404 page for expired or missing badges.
 */
export function render404Page(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Badge Not Found – PoHA</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #111111;
      color: #e0e0e0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
    }
    .icon { font-size: 48px; margin-bottom: 16px; opacity: 0.3; }
    h1 { font-size: 20px; color: #ffffff; margin-bottom: 8px; }
    p { font-size: 14px; color: #888888; max-width: 320px; text-align: center; }
  </style>
</head>
<body>
  <div class="icon">🛡️</div>
  <h1>Badge Not Found</h1>
  <p>This badge may have expired or never existed. Badges are retained for one year after creation.</p>
</body>
</html>`;
}

function getBandColor(band: string): string {
  switch (band) {
    case "high": return "#22c55e";
    case "moderate": return "#eab308";
    case "low": return "#f97316";
    case "none": return "#888888";
    default: return "#888888";
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function formatInputMethod(method: string): string {
  switch (method) {
    case "web_keyboard": return "Web Keyboard";
    case "accessibility_observed": return "Accessibility";
    case "compose_in_app": return "In-App";
    default: return method;
  }
}

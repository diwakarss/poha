import type { StoredAttestation } from "./types.js";

/** App URL for the CTA — override via env in production */
const APP_URL = "https://poha.ink";

/**
 * Render the HTML verification page.
 * Hero: pen emoji. Explainer: no overclaims. Technical details: collapsed.
 * Timestamp: hour-rounded per spec. Input method: humanized.
 */
export function renderVerifyPage(stored: StoredAttestation): string {
  const att = stored.attestation;

  // Hour-rounded timestamp per privacy spec
  const tsDate = new Date(att.timestamp_hour);
  const formattedDate = tsDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const formattedHour = tsDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    hour12: true,
  });

  const bandColor = getBandColor(att.effort_band);
  const bandLabel = att.effort_band.charAt(0).toUpperCase() + att.effort_band.slice(1);
  const durationStr = formatDuration(att.composition_duration_ms);
  const inputMethodStr = formatInputMethod(att.input_method);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Typed by hand &ndash; PoHA ${escapeHtml(stored.short_id)}</title>
  <meta name="description" content="This message was composed through direct keyboard interaction. Verified by PoHA.">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https://api.fontshare.com; font-src https://cdn.fontshare.com; img-src 'none'; script-src 'unsafe-inline'">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta http-equiv="X-Frame-Options" content="DENY">
  <link rel="preconnect" href="https://api.fontshare.com">
  <link href="https://api.fontshare.com/v2/css?f[]=satoshi@700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-verify: #0a0a0a;
      --surface-overlay: #1a1a1a;
      --text-inverse: #f0f0f0;
      --text-inverse-secondary: #9ca3af;
      --border-dark: #374151;
      --font-display: 'Satoshi', system-ui, sans-serif;
      --font-body: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --font-mono: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: var(--font-body);
      background: var(--bg-verify);
      color: var(--text-inverse);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 64px 16px;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 480px;
      width: 100%;
      text-align: center;
    }
    .hero-emoji {
      font-size: 64px;
      line-height: 1;
      margin-bottom: 24px;
    }
    .verify-hero {
      font-family: var(--font-display);
      font-size: 40px;
      font-weight: 700;
      line-height: 48px;
      color: var(--text-inverse);
      margin-bottom: 12px;
    }
    .verify-band {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: ${bandColor};
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 32px;
    }
    .verify-band .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: ${bandColor};
    }
    .verify-stats {
      display: flex;
      justify-content: center;
      gap: 32px;
      margin-bottom: 24px;
    }
    .verify-stat { text-align: center; }
    .verify-stat-value {
      font-size: 16px;
      font-weight: 500;
      color: var(--text-inverse);
    }
    .verify-stat-label {
      font-size: 12px;
      color: var(--text-inverse-secondary);
      margin-top: 4px;
    }
    .verify-input-method {
      font-size: 13px;
      color: var(--text-inverse-secondary);
      margin-bottom: 32px;
    }
    .verify-explainer {
      font-size: 13px;
      line-height: 20px;
      color: var(--text-inverse-secondary);
      max-width: 480px;
      margin: 0 auto 32px;
      text-align: left;
      padding: 16px;
      border: 1px solid var(--border-dark);
      border-radius: 8px;
    }
    /* Collapsed technical details */
    details {
      text-align: left;
      margin-bottom: 32px;
    }
    summary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--text-inverse-secondary);
      cursor: pointer;
      padding: 10px 16px;
      border: 1px solid var(--border-dark);
      border-radius: 6px;
      list-style: none;
      transition: background 100ms ease-out;
    }
    summary:hover {
      background: var(--surface-overlay);
    }
    summary::-webkit-details-marker { display: none; }
    summary::after {
      content: '\\25B8';
      font-size: 10px;
      transition: transform 200ms ease-out;
    }
    details[open] summary::after {
      transform: rotate(90deg);
    }
    .hash-section {
      padding: 16px;
      background: var(--surface-overlay);
      border: 1px solid var(--border-dark);
      border-radius: 8px;
      margin-top: 8px;
    }
    .hash-label {
      font-size: 12px;
      color: var(--text-inverse-secondary);
      margin-bottom: 4px;
    }
    .hash-value {
      font-size: 11px;
      color: #666666;
      font-family: var(--font-mono);
      word-break: break-all;
      line-height: 1.5;
    }
    .hash-spacer { margin-top: 12px; }
    /* CTA */
    .verify-cta {
      margin-bottom: 24px;
    }
    .verify-cta a {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: #1a1a1a;
      color: var(--text-inverse);
      border: 1px solid var(--border-dark);
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      transition: background 100ms ease-out;
    }
    .verify-cta a:hover {
      background: #252525;
    }
    .verify-footer {
      font-size: 13px;
      color: var(--text-inverse-secondary);
    }
    .verify-footer a {
      color: var(--text-inverse-secondary);
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    @media (max-width: 640px) {
      body { padding: 32px 16px; }
      .verify-hero { font-size: 32px; line-height: 40px; }
      .verify-stats { flex-direction: column; gap: 16px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero-emoji">\u270D\uFE0F</div>

    <div class="verify-hero">Typed by hand</div>
    <div class="verify-band"><span class="dot"></span> ${escapeHtml(bandLabel)} effort</div>

    <div class="verify-stats">
      <div class="verify-stat">
        <div class="verify-stat-value">${escapeHtml(durationStr)}</div>
        <div class="verify-stat-label">Duration</div>
      </div>
      <div class="verify-stat">
        <div class="verify-stat-value">${att.final_text_length.toLocaleString()} chars</div>
        <div class="verify-stat-label">Length</div>
      </div>
      <div class="verify-stat">
        <div class="verify-stat-value" id="ts" data-utc="${escapeHtml(att.timestamp_hour)}">${escapeHtml(formattedDate)}, ${escapeHtml(formattedHour)} UTC</div>
        <div class="verify-stat-label">Timestamp</div>
      </div>
    </div>

    <div class="verify-input-method">${escapeHtml(inputMethodStr)}</div>

    <div class="verify-explainer">
      This message was composed through direct keyboard interaction &mdash; typing, pausing, and editing in real time. PoHA measures how text was entered, never what was typed. No message content is stored.
    </div>

    <details>
      <summary>Technical details</summary>
      <div class="hash-section">
        <div class="hash-label">Content Hash</div>
        <div class="hash-value">${escapeHtml(att.content_hash)}</div>
        <div class="hash-spacer"></div>
        <div class="hash-label">Signer</div>
        <div class="hash-value">${escapeHtml(att.signer_pubkey)}</div>
      </div>
    </details>

    <div class="verify-cta">
      <a href="${APP_URL}">\u270D\uFE0F Get your own badge</a>
    </div>

    <div class="verify-footer">
      Proof of Human Attention v${escapeHtml(att.poha_version)}
    </div>
  </div>
  <script>
    try {
      var el = document.getElementById('ts');
      var d = new Date(el.dataset.utc);
      el.textContent = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        + ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
    } catch(e) {}
  </script>
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
  <title>Badge Not Found &ndash; PoHA</title>
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta http-equiv="X-Frame-Options" content="DENY">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #0a0a0a;
      color: #f0f0f0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
    }
    h1 { font-size: 20px; color: #ffffff; margin-bottom: 8px; }
    p { font-size: 14px; color: #9ca3af; max-width: 320px; text-align: center; }
  </style>
</head>
<body>
  <h1>Badge Not Found</h1>
  <p>This badge may have expired or never existed. Badges are retained for one year after creation.</p>
</body>
</html>`;
}


/** Escape HTML special characters to prevent XSS */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function getBandColor(band: string): string {
  switch (band) {
    case "high": return "#22c55e";
    case "moderate": return "#f59e0b";
    case "low": return "#6b7280";
    case "none": return "#6b7280";
    default: return "#6b7280";
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes} min ${remainingSeconds} sec`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function formatInputMethod(method: string): string {
  switch (method) {
    case "web_keyboard": return "Keyboard";
    case "accessibility_observed": return "Accessibility input";
    case "compose_in_app": return "In-app";
    default: return method.replace(/_/g, " ");
  }
}

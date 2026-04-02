/**
 * Privacy policy page for poha.ink/privacy.
 * Self-contained HTML with inline CSS matching landing page style.
 */
export function renderPrivacyPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Privacy Policy \u2014 PoHA</title>
  <meta name="description" content="PoHA privacy policy. What we collect, what we don\u2019t, and how your data is handled.">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'none'">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta http-equiv="X-Frame-Options" content="DENY">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --bg: #f8f9fa;
      --text: #2b3437;
      --text-muted: #586064;
      --primary: #4e6073;
      --surface: #f1f4f6;
      --font-headline: 'Manrope', system-ui, sans-serif;
      --font-body: 'Inter', system-ui, -apple-system, sans-serif;
    }
    body {
      font-family: var(--font-body);
      background: var(--bg);
      color: var(--text);
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 680px;
      margin: 0 auto;
      padding: 48px 24px 80px;
    }
    .back {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      color: var(--primary);
      text-decoration: none;
      margin-bottom: 32px;
    }
    .back:hover { opacity: 0.75; }
    h1 {
      font-family: var(--font-headline);
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.03em;
      margin-bottom: 8px;
    }
    .updated {
      font-size: 14px;
      color: var(--text-muted);
      margin-bottom: 40px;
    }
    h2 {
      font-family: var(--font-headline);
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.01em;
      margin-top: 36px;
      margin-bottom: 12px;
    }
    p, li {
      font-size: 15px;
      line-height: 1.75;
      color: var(--text-muted);
      margin-bottom: 12px;
    }
    ul {
      padding-left: 20px;
      margin-bottom: 12px;
    }
    li { margin-bottom: 6px; }
    a { color: var(--primary); }
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #e0e4e7;
      font-size: 14px;
      color: var(--text-muted);
      text-align: center;
    }
    .footer a {
      color: var(--text-muted);
      text-decoration: none;
    }
    .footer a:hover { color: var(--text); }
    @media (max-width: 640px) {
      .container { padding: 32px 20px 64px; }
      h1 { font-size: 26px; }
      h2 { font-size: 18px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <a class="back" href="/">\u2190 poha.ink</a>
    <h1>Privacy Policy</h1>
    <p class="updated">Last updated: April 3, 2026</p>

    <h2>What PoHA collects</h2>
    <p>PoHA measures how you type, not what you type. When you compose a message with PoHA active, the following data is collected on your device:</p>
    <ul>
      <li>Timestamps of keystroke events (when you pressed a key, not which key)</li>
      <li>Time gaps between keystrokes</li>
      <li>Number of characters added or removed per event</li>
      <li>Whether text was pasted from the clipboard</li>
      <li>Total composition duration</li>
      <li>Input method (keyboard type)</li>
    </ul>
    <p>This data is used to compute a single effort score between 0 and 1.</p>

    <h2>What PoHA does not collect</h2>
    <ul>
      <li>The text you type. PoHA never reads, stores, or transmits the content of your messages.</li>
      <li>Passwords, form data, or text in fields where you are not actively creating a badge.</li>
      <li>Browsing history, cookies, or page content.</li>
      <li>Location, contacts, camera, microphone, or any other device sensors.</li>
      <li>Personal identifiers such as your name, email address, or account information.</li>
    </ul>
    <p>The only time PoHA reads your message text is when you click the badge button. At that point, the text is hashed (converted to an irreversible fingerprint) on your device. The hash is sent to our server. The text itself is not.</p>

    <h2>What is sent to our server</h2>
    <p>When you create a badge, the following is sent to poha.ink:</p>
    <ul>
      <li>A SHA-256 hash of your message (not the message itself)</li>
      <li>Your composite effort score and effort band</li>
      <li>Composition duration in milliseconds</li>
      <li>Input method</li>
      <li>Message length in characters</li>
      <li>A timestamp rounded to the nearest hour</li>
      <li>Your Ed25519 public key (generated on your device, not linked to your identity)</li>
      <li>A cryptographic signature</li>
    </ul>
    <p>This data is stored for one year and then deleted. It is used solely to serve the verification page when someone taps your badge link.</p>

    <h2>Optional calibration data</h2>
    <p>If you opt in (off by default), PoHA may also send anonymous aggregate typing statistics to help improve scoring accuracy across languages and input methods. This includes signal values (entropy, duration, revision rate, event density, paste ratio), input method, browser locale, and a bucketed text length range. This data is not linked to your public key or any attestation. It cannot be traced back to you or to any specific message.</p>

    <h2>Encryption keys</h2>
    <p>PoHA generates an Ed25519 keypair on your device when you first use it. The private key is stored locally in your browser and never leaves your device. The public key is included in attestations so that anyone can verify the signature. These keys are not connected to your real identity unless you choose to share your public key alongside identifying information.</p>

    <h2>Third parties</h2>
    <p>PoHA does not sell, share, or provide your data to any third party. The verification server (poha.ink) runs on Cloudflare. Cloudflare may process standard web request metadata (IP address, user agent) as part of normal CDN operation. PoHA does not use analytics scripts, tracking pixels, or advertising networks on the verification page or landing page.</p>

    <h2>Data storage and retention</h2>
    <p>Attestation data is stored in Cloudflare KV with a one-year time-to-live. After one year, the attestation is automatically deleted and the verification link stops working. Badge history (last 50 badges) is stored locally in your browser and is not sent anywhere. You can clear it at any time by removing the extension.</p>

    <h2>Children</h2>
    <p>PoHA is not directed at children under 13. We do not knowingly collect data from children.</p>

    <h2>Your rights</h2>
    <p>You can stop using PoHA at any time by disabling or removing the extension. No account exists to delete because no account is created. Your locally stored keypair and badge history are removed when you uninstall the extension. Attestations already submitted to the server will expire after one year. If you need an attestation removed before expiration, contact us.</p>

    <h2>Changes to this policy</h2>
    <p>If this policy changes, the updated version will be posted at poha.ink/privacy with a new date. Material changes will be noted in the extension\u2019s changelog.</p>

    <h2>Contact</h2>
    <p>For questions about this policy or your data: <a href="https://x.com/1nimit">@1nimit</a> on X or <a href="https://github.com/diwakarss/poha/issues">open an issue</a> on GitHub.</p>

    <div class="footer">
      <a href="/">PoHA</a> &middot; Proof of Human Attention
    </div>
  </div>
</body>
</html>`;
}

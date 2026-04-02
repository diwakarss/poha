/**
 * Landing page for poha.ink root.
 * Self-contained HTML with inline CSS. External assets: Manrope + Inter from Google Fonts, Material Symbols.
 */
export function renderLandingPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PoHA \u2014 Prove you typed it</title>
  <meta name="description" content="People already think your messages are AI. Prove them wrong. Open source.">
  <meta property="og:title" content="PoHA \u2014 Prove you typed it">
  <meta property="og:description" content="People already think your messages are AI. Prove them wrong. Open source.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://poha.ink">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="PoHA \u2014 Prove you typed it">
  <meta name="twitter:description" content="People already think your messages are AI. Prove them wrong.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Inter:wght@400;500;600&family=Material+Symbols+Outlined:opsz,wght,FILL@20..48,100..700,0..1&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --bg-dark: #2b3437;
      --bg-light: #f8f9fa;
      --surface-low: #f1f4f6;
      --surface-card: #ffffff;
      --text-dark: #f4f8ff;
      --text-dark-muted: #9b9d9e;
      --text-light: #2b3437;
      --text-light-muted: #586064;
      --primary: #4e6073;
      --primary-dim: #425467;
      --primary-container: #d1e4fb;
      --secondary-container: #cbe7f5;
      --on-secondary-container: #3c5561;
      --font-headline: 'Manrope', system-ui, sans-serif;
      --font-body: 'Inter', system-ui, -apple-system, sans-serif;
    }

    body {
      font-family: var(--font-body);
      background: var(--bg-light);
      color: var(--text-light);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      vertical-align: middle;
    }

    /* Nav */
    .nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      background: rgba(43, 52, 55, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-brand .material-symbols-outlined {
      color: var(--primary-container);
      font-size: 22px;
    }

    .nav-brand span:last-child {
      font-family: var(--font-headline);
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--text-dark);
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 32px;
    }

    .nav-links a {
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--text-dark-muted);
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .nav-links a:hover { color: var(--text-dark); }

    /* Hero */
    .hero {
      background: var(--bg-dark);
      color: var(--text-dark);
      padding: 128px 24px 72px;
    }

    .hero-grid {
      max-width: 1080px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
      align-items: center;
    }

    .hero-left {
      display: flex;
      flex-direction: column;
    }

    .hero-emoji {
      font-size: 48px;
      margin-bottom: 28px;
      display: block;
    }

    .hero h1 {
      font-family: var(--font-headline);
      font-size: 52px;
      font-weight: 800;
      letter-spacing: -0.04em;
      line-height: 1.05;
      color: #ffffff;
      margin-bottom: 18px;
    }

    .hero-sub {
      font-size: 17px;
      line-height: 1.6;
      color: var(--text-dark-muted);
      max-width: 400px;
      margin-bottom: 36px;
    }

    .hero-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .btn-hero {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 28px;
      background: var(--primary);
      color: var(--text-dark);
      font-family: var(--font-body);
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      text-decoration: none;
      border-radius: 6px;
      transition: background 0.15s ease;
      cursor: pointer;
    }

    .btn-hero:hover { background: var(--primary-dim); }

    .btn-ghost {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 28px;
      background: transparent;
      color: var(--text-dark-muted);
      font-family: var(--font-body);
      font-size: 13px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      text-decoration: none;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 6px;
      transition: border-color 0.15s ease, color 0.15s ease;
      cursor: pointer;
    }

    .btn-ghost:hover { border-color: rgba(255,255,255,0.25); color: var(--text-dark); }

    /* Demo Card */
    .demo-card {
      background: #1a1e20;
      border-radius: 12px;
      padding: 28px 28px 22px;
      position: relative;
      border: 1px solid rgba(255,255,255,0.06);
      box-shadow: 0 24px 48px -12px rgba(0,0,0,0.25);
    }

    .demo-msg {
      font-size: 15px;
      line-height: 1.75;
      color: #c3c8cb;
      margin-bottom: 20px;
    }

    .demo-badge-row {
      padding-top: 16px;
      border-top: 1px solid rgba(255,255,255,0.06);
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(78, 96, 115, 0.3);
      padding: 5px 12px;
      border-radius: 100px;
    }

    .badge-pill .label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--primary-container);
    }

    .badge-link {
      font-family: ui-monospace, 'SF Mono', 'Cascadia Code', monospace;
      font-size: 13px;
      color: var(--text-dark-muted);
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .badge-link:hover {
      color: var(--primary-container);
    }

    .demo-caption {
      font-size: 13px;
      color: rgba(209, 228, 251, 0.5);
      margin-top: 14px;
      text-align: center;
    }

    /* Light content area */
    .content {
      max-width: 720px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* How It Works */
    .how-section {
      padding: 72px 0 0;
    }

    .how-card {
      background: var(--surface-low);
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 24px;
    }

    .how-card h2 {
      font-family: var(--font-headline);
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text-light);
      margin-bottom: 12px;
    }

    .how-card p {
      font-size: 16px;
      line-height: 1.7;
      color: var(--text-light-muted);
    }

    .how-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .how-col h3 {
      font-family: var(--font-headline);
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--text-light);
      margin-bottom: 8px;
    }

    .how-col p {
      font-size: 14px;
      line-height: 1.7;
      color: var(--text-light-muted);
    }

    /* CTA */
    .cta-section {
      padding: 72px 0 80px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .btn-cta {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 16px 36px;
      background: var(--primary);
      color: #f4f8ff;
      font-family: var(--font-body);
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      border-radius: 8px;
      transition: background 0.15s ease;
      cursor: pointer;
    }

    .btn-cta:hover { background: var(--primary-dim); }
    .btn-cta .material-symbols-outlined { font-size: 18px; }

    .link-source {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 500;
      color: var(--primary);
      text-decoration: none;
      transition: opacity 0.15s ease;
    }

    .link-source:hover { opacity: 0.75; }
    .link-source .material-symbols-outlined { font-size: 18px; }

    /* Footer */
    footer {
      background: var(--surface-low);
      padding: 40px 24px;
      text-align: center;
    }

    .footer-brand {
      font-family: var(--font-headline);
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--text-light);
      margin-bottom: 12px;
    }

    .footer-text {
      font-size: 14px;
      color: var(--text-light-muted);
      line-height: 1.6;
    }

    .footer-text a {
      color: var(--text-light-muted);
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .footer-text a:hover { color: var(--text-light); }

    .footer-links {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-top: 16px;
    }

    .footer-links a {
      font-size: 14px;
      color: var(--text-light-muted);
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .footer-links a:hover { color: var(--text-light); }

    /* Focus */
    .btn-hero:focus-visible,
    .btn-ghost:focus-visible,
    .btn-cta:focus-visible,
    .link-source:focus-visible,
    .badge-link:focus-visible,
    .nav-links a:focus-visible,
    .footer-links a:focus-visible,
    .footer-text a:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 3px;
      border-radius: 4px;
    }

    /* Responsive */
    @media (max-width: 900px) {
      .hero-grid {
        grid-template-columns: 1fr;
        gap: 40px;
        max-width: 560px;
      }

      .hero h1 { font-size: 44px; }

      .demo-card {
        max-width: 480px;
      }
    }

    @media (max-width: 640px) {
      .nav-links { display: none; }

      .hero {
        padding: 108px 20px 56px;
      }

      .hero h1 { font-size: 36px; }

      .hero-sub { font-size: 16px; }

      .hero-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .btn-hero, .btn-ghost {
        justify-content: center;
      }

      .content { padding: 0 20px; }

      .demo-card { padding: 22px; }

      .demo-msg { font-size: 14px; }

      .how-section { padding-top: 48px; }

      .how-card { padding: 24px; }

      .how-columns {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .cta-section { padding: 56px 0 64px; }

      .btn-cta {
        width: 100%;
        max-width: 320px;
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .hero h1 { font-size: 30px; }
      .hero-emoji { font-size: 40px; margin-bottom: 20px; }
      .demo-card { padding: 18px; }
      .how-card { padding: 20px; }
      .how-card h2 { font-size: 20px; }
    }

    @media (prefers-reduced-motion: reduce) {
      * { transition: none !important; }
    }
  </style>
</head>
<body>

  <header class="nav">
    <div class="nav-brand">
      <span class="material-symbols-outlined">edit_note</span>
      <span>PoHA</span>
    </div>
    <nav class="nav-links">
      <a href="https://web.poha.ink">Verify</a>
      <a href="https://github.com/diwakarss/poha">Source</a>
    </nav>
  </header>

  <section class="hero">
    <div class="hero-grid">
      <div class="hero-left">
        <div class="hero-emoji" aria-hidden="true">\u270D\uFE0F</div>
        <h1>PROVE YOU<br>TYPED IT</h1>
        <p class="hero-sub">People already think your messages are AI. Prove them wrong.</p>
        <div class="hero-actions">
          <a class="btn-hero" href="https://web.poha.ink">Try It Now<span class="material-symbols-outlined" style="font-size:16px">arrow_forward</span></a>
          <a class="btn-ghost" href="https://github.com/diwakarss/poha">View Source</a>
        </div>
      </div>
      <div class="hero-right">
        <div class="demo-card">
          <div class="demo-msg">&ldquo;Spent the morning debugging a race condition that only shows up under load. Turned out to be a missing mutex on the session cache. Three hours for one line.&rdquo;</div>
          <div class="demo-badge-row">
            <span class="badge-pill">
              <span style="font-size:12px">\u270D\uFE0F</span>
              <span class="label">Human-typed</span>
            </span>
            <a class="badge-link" href="https://poha.ink/iYraB">poha.ink/iYraB</a>
          </div>
        </div>
        <p class="demo-caption">Anyone can tap the link to verify.</p>
      </div>
    </div>
  </section>

  <div class="content">
    <section class="how-section">
      <div class="how-card">
        <h2>The Logic</h2>
        <p>You type a message. PoHA measures your timing, pauses, and revisions without reading what you type.</p>
      </div>
      <div class="how-columns">
        <div class="how-col">
          <h3>Proof</h3>
          <p>If enough human effort is detected, you get a badge: a short link anyone can tap to see the proof.</p>
        </div>
        <div class="how-col">
          <h3>Integrity</h3>
          <p>No accounts. No data stored. Open source. Factual and private by design.</p>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <a class="btn-cta" href="https://web.poha.ink">Try it now <span class="material-symbols-outlined">arrow_forward</span></a>
      <a class="link-source" href="https://github.com/diwakarss/poha"><span class="material-symbols-outlined">code</span> View source on GitHub</a>
    </section>
  </div>

  <footer>
    <div class="footer-brand">PoHA</div>
    <p class="footer-text">Proof of Human Attention &middot; Open source &middot; <a href="https://x.com/1nimit">@1nimit</a></p>
    <div class="footer-links">
      <a href="https://github.com/diwakarss/poha">GitHub</a>
      <a href="/privacy">Privacy</a>
    </div>
  </footer>

</body>
</html>`;
}

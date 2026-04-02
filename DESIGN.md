# Design System — PoHA (Proof of Human Attention)

## Product Context
- **What this is:** Badge any message with a verification link that proves human attention through typing behavior metadata. One line (`✍️ poha.ink/iYraB`), no app needed on the receiving end.
- **Who it's for:** People who want to prove they typed something themselves, not AI-generated. Messaging-heavy users.
- **Space/industry:** Trust/verification, anti-AI-content provenance. Peers: SSL certificate pages, identity verification UIs, blockchain explorers.
- **Project type:** Web app (compose page) + static verification page + Android app.

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian with Trust Signaling
- **Decoration level:** Minimal. Typography and spacing do the work. The only decorative element is the shield/typing-rhythm mark on the verification page.
- **Mood:** Notary seal. Calm, authoritative, minimal. The product proves something, it should feel like a stamp of authenticity. When color appears, it means something.
- **Visual motif:** Shield containing typing rhythm bars (vertical bars at varying heights, like a sound waveform for keystroke timing). This is the singular brand mark. If you see rhythm bars, it's PoHA. No other illustrations or decorative elements except Android onboarding.

## Typography
- **Display/Hero:** Satoshi (Variable, Fontshare). Geometric sans with warmth. Used ONLY for "Typed by hand" hero text on verification page and the "PoHA" wordmark. Not used in compose page UI.
- **Body/UI:** system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif. Native feel, zero load time. Used for all compose page text, labels, buttons, body content.
- **Data/Tables:** "SF Mono", "Cascadia Code", "Fira Code", monospace. For badge IDs, hashes, timestamps, technical data on verification page.
- **Code:** Same mono stack.
- **Loading:** Satoshi self-hosted as single variable WOFF2 (~40KB). Preloaded on verification page only via `<link rel="preload">`. Compose page loads zero web fonts.
- **Scale (4px-based, 1.25 modular ratio):**

| Token | Size / Line Height | Usage |
|-------|-------------------|-------|
| text-xs | 12px / 16px | Caption, fine print, input method label |
| text-sm | 14px / 20px | Body text, labels, effort pill text |
| text-base | 16px / 24px | Emphasis, compose field text, buttons |
| text-lg | 20px / 28px | Section headers |
| text-xl | 24px / 32px | Page headers, "High typing effort detected" |
| text-2xl | 32px / 40px | Hero secondary |
| text-3xl | 40px / 48px | Hero display, "Typed by hand" |

- **Weights:** 400 regular, 500 medium, 600 semibold, 700 bold

## Color
- **Approach:** Restrained. 1 accent + neutrals. Color is rare and meaningful. Chromatic color only appears in effort bands (grey/amber/green) and semantic states (error/success). Everything else is black, white, and grey.

### Surfaces
| Token | Value | Usage |
|-------|-------|-------|
| --bg-compose | #ffffff | Light compose page background |
| --bg-verify | #0a0a0a | Dark verification page background |
| --surface-raised | #f9fafb | Cards, inputs on light background |
| --surface-sunken | #f3f4f6 | Text field background, recessed areas |
| --surface-overlay | #1a1a1a | Cards, panels on dark background |

### Text
| Token | Value | Usage |
|-------|-------|-------|
| --text-primary | #111827 | High-contrast body text on light bg |
| --text-secondary | #4b5563 | Labels, captions on light bg (WCAG AA on white) |
| --text-tertiary | #9ca3af | Placeholder, timestamps, metadata |
| --text-inverse | #f0f0f0 | Primary text on dark background |
| --text-inverse-secondary | #9ca3af | Labels, captions on dark background |

### Effort Colors
| Token | Value | Band | Usage |
|-------|-------|------|-------|
| --effort-none | #6b7280 | none/low | Grey. Insufficient signals or low effort |
| --effort-moderate | #f59e0b | moderate | Amber. Building effort, score 0.4-0.7 |
| --effort-high | #22c55e | high | Green. Ready to badge, score 0.7-1.0 |

### Semantic
| Token | Value | Usage |
|-------|-------|-------|
| --error | #ef4444 | Network failures, rate limit errors |
| --error-bg | #fef2f2 | Error banner/toast background |
| --success | #22c55e | Badge created (reuses effort-high) |
| --success-bg | #f0fdf4 | Success toast background |
| --info | #6b7280 | Neutral informational (reuses grey) |

### Borders
| Token | Value | Usage |
|-------|-------|-------|
| --border-default | #e5e7eb | Input borders, dividers on light bg |
| --border-focus | #111827 | Focused input ring, high contrast |
| --border-dark | #374151 | Dividers, borders on dark background |

- **Dark mode strategy:** Not applicable for v1. Compose page is light. Verification page is dark. These are intentional surface choices, not theme variants.

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable

| Token | Value | Usage |
|-------|-------|-------|
| --space-1 | 4px | Tight gaps, icon padding |
| --space-2 | 8px | Inline spacing, small gaps |
| --space-3 | 12px | Button padding-y, form gaps |
| --space-4 | 16px | Standard padding, card padding, mobile edge |
| --space-5 | 20px | Section padding on mobile |
| --space-6 | 24px | Loose padding, section gaps |
| --space-8 | 32px | Section spacing |
| --space-10 | 40px | Large section breaks |
| --space-12 | 48px | Page-level spacing |
| --space-16 | 64px | Hero spacing, verification page top/bottom |

## Layout
- **Approach:** Grid-disciplined. Simple, mobile-first stacking.
- **Grid:** Single column, max-width container.
- **Max content width:** 640px (compose page), full-width (verification page)
- **Compose page:** Centered container, 16px edge padding on mobile, auto margins on desktop.
- **Verification page:** Full-width dark background, content centered within.
- **Responsive:** Mobile-first. Effort pill and badge button stack vertically on mobile, sit in a row on desktop. Text field full-width with 16px padding.
- **Border radius:**

| Token | Value | Usage |
|-------|-------|-------|
| --radius-sm | 4px | Small elements, tags |
| --radius-md | 6px | Buttons, inputs |
| --radius-lg | 8px | Cards, containers, mockup frames |
| --radius-pill | 9999px | Effort indicator pill |

## Motion
- **Approach:** Minimal-functional. Only animations that aid comprehension or confirm actions. No decorative motion.

### Duration Scale
| Token | Value | Usage |
|-------|-------|-------|
| --duration-micro | 100ms | Hover feedback, instant state change |
| --duration-short | 200ms | State changes, checkmark animation, banner dismiss |
| --duration-medium | 300ms | Effort indicator color transition |
| --duration-long | 500ms | Reserved for future page transitions |

### Easing
| Token | Value | Usage |
|-------|-------|-------|
| --ease-in | cubic-bezier(0.4, 0, 1, 0.2) | Exit animations |
| --ease-out | cubic-bezier(0, 0, 0.2, 1) | Entrance animations, checkmark |
| --ease-in-out | cubic-bezier(0.4, 0, 0.2, 1) | Continuous transitions, effort color |

### Inventory of Animations (v1, exhaustive)
1. **Effort indicator transition:** Grey → amber → green. 300ms ease-in-out on background-color and color.
2. **Badge button spinner:** CSS rotate 360deg, 800ms linear infinite. During POST /attest.
3. **Success checkmark:** Scale 0 → 1, 200ms ease-out. On badge creation success.
4. **Toast appearance:** Opacity 0 → 1, 150ms ease-out. Visible 2s. Fade out 150ms ease-in.
5. **First-visit banner dismiss:** Slide up + fade, 200ms ease-out.

No other animations. If it's not on this list, it doesn't animate.

## Touch Targets
- **Web:** 44px minimum (WCAG 2.2 Target Size)
- **Android:** 48dp minimum (Material Design)
- **Android floating overlay:** 16dp visual dot, 48dp invisible touch target (padding)

## Accessibility
- All effort colors meet WCAG AA contrast on their backgrounds.
- --text-secondary (#4b5563) on white: 6.0:1 contrast ratio. Use for text smaller than 16px.
- --text-inverse (#f0f0f0) on --bg-verify (#0a0a0a): 17.4:1 contrast ratio.
- Effort indicator: `aria-live="polite"` for screen reader state announcements.
- Badge button: `aria-disabled="true"` with descriptive `aria-label` when score < 0.4.
- Verification page: semantic HTML (`<main>`, `<header>`, `<footer>`).
- Keyboard navigation: Tab through compose field, then badge button. Enter/Space to activate.

## Voice & Copy Guidelines
- **Tone:** Calm, factual, trustworthy. Not techy, not playful, not corporate. Like a notary explaining what they do.
- **Hero text:** "Typed by hand" (not "Verified by PoHA", not "Human-authored content", not "Proof of Human Authorship").
- **Effort indicators:** Simple present tense. "Start typing", "Building effort...", "Ready to badge".
- **Error messages:** State what happened + what to do. "Could not create badge. Check your connection." Not "Oops!" or "Something went wrong!"
- **Explainer copy:** Third person, passive voice is OK for trust language. "The author's keystrokes were analyzed..." not "We analyzed your keystrokes..."
- **Badge format:** `✍️ poha.ink/{id}`. No branding text, no explanation inline. The link IS the explanation.
- **No marketing language** in the product UI. No "powerful", "seamless", "unlock". Just state what it does.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-01 | Initial design system created | Created by /design-consultation based on /office-hours design doc + /plan-design-review tokens |
| 2026-04-01 | Satoshi as sole display font | Geometric sans with warmth for verification hero. System fonts everywhere else for native feel and zero load time |
| 2026-04-01 | Restrained color, effort-only chromatic | Trust products don't scream. Color appears only when it means something (effort band, error/success) |
| 2026-04-01 | No illustrations except shield mark + Android onboarding | Typing rhythm bars as singular visual motif. Unmistakable identity from one element |
| 2026-04-01 | 5 named animations, exhaustive list | If it's not on the list, it doesn't animate. Prevents motion creep |

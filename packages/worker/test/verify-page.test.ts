import { describe, expect, test } from "bun:test";
import { renderVerifyPage, render404Page } from "../src/verify-page.js";
import type { StoredAttestation } from "../src/types.js";

describe("renderVerifyPage", () => {
  const stored: StoredAttestation = {
    attestation: {
      poha_version: "0.1",
      content_hash: "sha256:" + "a".repeat(64),
      effort_score: 0.82,
      effort_band: "high",
      composition_duration_ms: 45000,
      input_method: "web_keyboard",
      final_text_length: 312,
      timestamp_hour: "2026-04-01T14:00:00.000Z",
      signer_pubkey: "ed25519:abc123",
      signature: "ed25519:def456",
    },
    created_at: "2026-04-01T14:30:00.000Z",
    short_id: "Ab12x",
  };

  test("renders valid HTML", () => {
    const html = renderVerifyPage(stored);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  test("includes badge ID", () => {
    const html = renderVerifyPage(stored);
    expect(html).toContain("Ab12x");
  });

  test("includes effort band label", () => {
    const html = renderVerifyPage(stored);
    expect(html).toContain("High Effort Detected");
  });

  test("includes effort score", () => {
    const html = renderVerifyPage(stored);
    expect(html).toContain("0.82");
  });

  test("includes content hash", () => {
    const html = renderVerifyPage(stored);
    expect(html).toContain("sha256:" + "a".repeat(64));
  });

  test("includes 'Typed by Hand' title", () => {
    const html = renderVerifyPage(stored);
    expect(html).toContain("Typed by Hand");
  });

  test("formats duration correctly", () => {
    const html = renderVerifyPage(stored);
    // 45000ms = 0m 45s
    expect(html).toContain("45s");
  });

  test("uses green color for high effort", () => {
    const html = renderVerifyPage(stored);
    expect(html).toContain("#22c55e");
  });
});

describe("render404Page", () => {
  test("renders valid HTML", () => {
    const html = render404Page();
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Badge Not Found");
  });

  test("mentions expiration", () => {
    const html = render404Page();
    expect(html).toContain("expired");
  });
});

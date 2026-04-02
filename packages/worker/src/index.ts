import type { Env, Attestation, StoredAttestation, CalibrationSignals } from "./types.js";
import { validateAttestation } from "./validate.js";
import { generateShortId } from "./short-id.js";
import { checkAndIncrementRateLimit } from "./rate-limit.js";
import { renderVerifyPage, render404Page } from "./verify-page.js";
import { renderLandingPage } from "./landing-page.js";
import { renderPrivacyPage } from "./privacy-page.js";

export { RateLimiterDO } from "./rate-limiter-do.js";

const KV_TTL_SECONDS = 365 * 24 * 60 * 60; // 1 year
const CALIBRATION_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days
const MAX_COLLISION_RETRIES = 5;
const SHORT_ID_PATTERN = /^\/([A-Za-z0-9]{5})$/;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(request),
      });
    }

    // POST /attest — submit an attestation
    if (request.method === "POST" && path === "/attest") {
      return handleAttest(request, env, ctx);
    }

    // GET /api/:id — raw attestation JSON
    const apiMatch = path.match(/^\/api\/([A-Za-z0-9]{5})$/);
    if (request.method === "GET" && apiMatch) {
      return handleApi(apiMatch[1], env, request);
    }

    // GET / — landing page
    if (request.method === "GET" && path === "/") {
      return new Response(renderLandingPage(), {
        headers: { "Content-Type": "text/html;charset=utf-8" },
      });
    }

    // GET /privacy — privacy policy
    if (request.method === "GET" && path === "/privacy") {
      return new Response(renderPrivacyPage(), {
        headers: {
          "Content-Type": "text/html;charset=utf-8",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // GET /:id — verification page (5-char alphanumeric)
    const verifyMatch = path.match(SHORT_ID_PATTERN);
    if (request.method === "GET" && verifyMatch) {
      return handleVerify(verifyMatch[1], env, request, ctx);
    }

    return Response.json({ error: "not found" }, { status: 404 });
  },
};

async function handleAttest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  let att: Attestation;
  let calibration: CalibrationSignals | undefined;
  try {
    const body = await request.json();
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ error: "body must be a JSON object" }, {
        status: 400,
        headers: corsHeaders(request),
      });
    }
    const { calibration_signals, ...rest } = body as any;
    att = rest as Attestation;
    if (calibration_signals && typeof calibration_signals === "object" && !Array.isArray(calibration_signals)) {
      calibration = calibration_signals as CalibrationSignals;
    }
  } catch {
    return Response.json({ error: "invalid JSON body" }, {
      status: 400,
      headers: corsHeaders(request),
    });
  }

  let validation;
  try {
    validation = await validateAttestation(att);
  } catch {
    return Response.json({ error: "invalid attestation structure" }, {
      status: 400,
      headers: corsHeaders(request),
    });
  }
  if (!validation.valid) {
    return Response.json({ error: validation.error }, {
      status: 400,
      headers: corsHeaders(request),
    });
  }

  const rateCheck = await checkAndIncrementRateLimit(env, att.signer_pubkey);
  if (!rateCheck.allowed) {
    return Response.json({ error: "rate limit exceeded (100/day per key)" }, {
      status: 429,
      headers: {
        ...corsHeaders(request),
        "Retry-After": "86400",
      },
    });
  }

  let shortId = "";
  for (let i = 0; i < MAX_COLLISION_RETRIES; i++) {
    const candidate = generateShortId();
    const existing = await env.ATTESTATIONS.get(`att:${candidate}`);
    if (!existing) {
      shortId = candidate;
      break;
    }
  }
  if (!shortId) {
    return Response.json({ error: "failed to generate unique ID, please retry" }, {
      status: 500,
      headers: corsHeaders(request),
    });
  }

  const stored: StoredAttestation = {
    attestation: att,
    created_at: new Date().toISOString(),
    short_id: shortId,
  };

  await env.ATTESTATIONS.put(
    `att:${shortId}`,
    JSON.stringify(stored),
    { expirationTtl: KV_TTL_SECONDS }
  );

  if (calibration) {
    ctx.waitUntil(storeCalibration(env, calibration));
  }

  return Response.json({
    short_id: shortId,
    verify_url: `/${shortId}`,
    remaining_today: rateCheck.remaining,
  }, {
    status: 201,
    headers: corsHeaders(request),
  });
}

async function handleVerify(id: string, env: Env, request: Request, ctx: ExecutionContext): Promise<Response> {
  const data = await env.ATTESTATIONS.get(`att:${id}`);
  if (!data) {
    return new Response(render404Page(), {
      status: 404,
      headers: { "Content-Type": "text/html;charset=utf-8" },
    });
  }

  // Track referrer domain (fire-and-forget)
  ctx.waitUntil(trackReferrer(env, id, request));

  const stored: StoredAttestation = JSON.parse(data);
  return new Response(renderVerifyPage(stored), {
    headers: {
      "Content-Type": "text/html;charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

async function handleApi(id: string, env: Env, request: Request): Promise<Response> {
  const data = await env.ATTESTATIONS.get(`att:${id}`);
  if (!data) {
    return Response.json({ error: "not found" }, {
      status: 404,
      headers: corsHeaders(request),
    });
  }

  const stored: StoredAttestation = JSON.parse(data);
  return Response.json(stored, {
    headers: {
      ...corsHeaders(request),
      "Cache-Control": "public, max-age=3600",
    },
  });
}

async function storeCalibration(env: Env, cal: CalibrationSignals): Promise<void> {
  try {
    const key = `cal:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await env.CALIBRATION.put(key, JSON.stringify(cal), {
      expirationTtl: CALIBRATION_TTL_SECONDS,
    });
  } catch {
    // Never fail attestation for calibration
  }
}

async function trackReferrer(env: Env, id: string, request: Request): Promise<void> {
  try {
    const referer = request.headers.get("Referer");
    if (!referer) return;
    const domain = new URL(referer).hostname;
    if (!domain) return;

    const key = `ref:${domain}`;
    const existing = await env.ATTESTATIONS.get(key);
    const counts: Record<string, number> = existing ? JSON.parse(existing) : {};
    counts[id] = (counts[id] || 0) + 1;

    await env.ATTESTATIONS.put(key, JSON.stringify(counts), {
      expirationTtl: KV_TTL_SECONDS,
    });
  } catch {
    // Never fail the page render for analytics
  }
}

const ALLOWED_ORIGINS = [
  "https://poha.ink",
  "https://web.poha.ink",
  "https://app.poha.ink",
  "https://poha.dev",
  "https://www.poha.dev",
  "https://www.poha.ink",
  "http://localhost:5173",
];

function corsHeaders(request?: Request): Record<string, string> {
  const origin = request?.headers.get("Origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

import type { Env, Attestation, StoredAttestation } from "./types.js";
import { validateAttestation } from "./validate.js";
import { generateShortId } from "./short-id.js";
import { checkAndIncrementRateLimit } from "./rate-limit.js";
import { renderVerifyPage, render404Page } from "./verify-page.js";

export { RateLimiterDO } from "./rate-limiter-do.js";

const KV_TTL_SECONDS = 365 * 24 * 60 * 60; // 1 year
const MAX_COLLISION_RETRIES = 5;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for API endpoints
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(request),
      });
    }

    // POST /attest — submit an attestation
    if (request.method === "POST" && path === "/attest") {
      return handleAttest(request, env);
    }

    // GET /v/:id — verification page (HTML)
    const verifyMatch = path.match(/^\/v\/([A-Za-z0-9]{5})$/);
    if (request.method === "GET" && verifyMatch) {
      return handleVerify(verifyMatch[1], env, request);
    }

    // GET /api/:id — raw attestation JSON
    const apiMatch = path.match(/^\/api\/([A-Za-z0-9]{5})$/);
    if (request.method === "GET" && apiMatch) {
      return handleApi(apiMatch[1], env, request);
    }

    // GET / — health check
    if (request.method === "GET" && path === "/") {
      return Response.json({ service: "poha-worker", version: "0.1", status: "ok" });
    }

    return Response.json({ error: "not found" }, { status: 404 });
  },
};

async function handleAttest(request: Request, env: Env): Promise<Response> {
  // Parse body
  let att: Attestation;
  try {
    const body = await request.json();
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ error: "body must be a JSON object" }, {
        status: 400,
        headers: corsHeaders(request),
      });
    }
    att = body as Attestation;
  } catch {
    return Response.json({ error: "invalid JSON body" }, {
      status: 400,
      headers: corsHeaders(request),
    });
  }

  // Validate attestation (structure, signature, timestamp, score/band)
  const validation = await validateAttestation(att);
  if (!validation.valid) {
    return Response.json({ error: validation.error }, {
      status: 400,
      headers: corsHeaders(request),
    });
  }

  // Rate limiting: 100 per pubkey per day (atomic check + increment)
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

  // Generate unique short ID (retry on collision)
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

  // Store in KV
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

  return Response.json({
    short_id: shortId,
    verify_url: `/v/${shortId}`,
    remaining_today: rateCheck.remaining,
  }, {
    status: 201,
    headers: corsHeaders(request),
  });
}

async function handleVerify(id: string, env: Env, request: Request): Promise<Response> {
  const data = await env.ATTESTATIONS.get(`att:${id}`);
  if (!data) {
    return new Response(render404Page(), {
      status: 404,
      headers: { "Content-Type": "text/html;charset=utf-8" },
    });
  }

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

const ALLOWED_ORIGINS = [
  "https://poha.dev",
  "https://www.poha.dev",
  "https://poha.ink",
  "https://www.poha.ink",
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

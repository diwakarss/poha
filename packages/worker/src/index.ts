import type { Env, Attestation, StoredAttestation, CalibrationSignals } from "./types.js";
import { validateAttestation } from "./validate.js";
import { generateShortId } from "./short-id.js";
import { checkAndIncrementRateLimit } from "./rate-limit.js";
import { renderVerifyPage, render404Page } from "./verify-page.js";

export { RateLimiterDO } from "./rate-limiter-do.js";

const KV_TTL_SECONDS = 365 * 24 * 60 * 60; // 1 year
const CALIBRATION_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days
const MAX_COLLISION_RETRIES = 5;
const SHORT_ID_PATTERN = /^\/([A-Za-z0-9]{5})$/;

/** PAGES KV keys for content managed by poha-apps/landing-page */
const PAGE_ROUTES: Record<string, { key: string; type: string; cache: string }> = {
  "/":                     { key: "page:index",              type: "text/html;charset=utf-8", cache: "public, max-age=300" },
  "/privacy":              { key: "page:privacy",            type: "text/html;charset=utf-8", cache: "public, max-age=86400" },
  "/favicon.png":          { key: "asset:favicon.png",       type: "image/png",               cache: "public, max-age=604800, immutable" },
  "/favicon.ico":          { key: "asset:favicon.png",       type: "image/png",               cache: "public, max-age=604800, immutable" },
  "/apple-touch-icon.png": { key: "asset:apple-touch-icon.png", type: "image/png",            cache: "public, max-age=604800, immutable" },
  "/og-image.png":         { key: "asset:og-image.png",      type: "image/png",               cache: "public, max-age=604800, immutable" },
  "/sitemap.xml":          { key: "page:sitemap",            type: "application/xml",         cache: "public, max-age=86400" },
  "/robots.txt":           { key: "page:robots",             type: "text/plain",              cache: "public, max-age=86400" },
};

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

    // OAuth proxy for Decap CMS GitHub auth
    if (path === "/oauth/auth") {
      return handleOAuthAuth(env);
    }
    if (path === "/oauth/callback") {
      return handleOAuthCallback(url, env);
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

    // Pages and static assets — served from PAGES KV (deployed by poha-apps)
    if (request.method === "GET") {
      const route = PAGE_ROUTES[path];
      if (route) {
        return servePage(env, route);
      }
    }

    // GET /blog/* — blog pages from PAGES KV
    if (request.method === "GET" && path.startsWith("/blog")) {
      return serveBlog(env, path);
    }

    // GET /:id — verification page (5-char alphanumeric)
    const verifyMatch = path.match(SHORT_ID_PATTERN);
    if (request.method === "GET" && verifyMatch) {
      return handleVerify(verifyMatch[1], env, request, ctx);
    }

    return Response.json({ error: "not found" }, { status: 404 });
  },
};

function handleOAuthAuth(env: Env): Response {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: "https://poha.ink/oauth/callback",
    scope: "repo,user",
  });
  return Response.redirect(`https://github.com/login/oauth/authorize?${params}`, 301);
}

async function handleOAuthCallback(url: URL, env: Env): Promise<Response> {
  const code = url.searchParams.get("code");
  if (!code) {
    return new Response("Missing code parameter", { status: 400 });
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await tokenRes.json() as { access_token?: string; error?: string };
  const token = data.access_token;
  const error = data.error;

  const content = token
    ? `authorization:github:success:{"token":"${token}","provider":"github"}`
    : `authorization:github:error:${error || "unknown error"}`;

  return new Response(
    `<!DOCTYPE html><html><body><script>
(function(){window.opener.postMessage('${content}','*');window.close();})();
</script></body></html>`,
    { headers: { "Content-Type": "text/html;charset=utf-8" } },
  );
}

const BLOG_MIME_TYPES: Record<string, string> = {
  ".html": "text/html;charset=utf-8",
  ".xml": "application/xml",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".css": "text/css",
  ".js": "application/javascript",
};

async function serveBlog(env: Env, path: string): Promise<Response> {
  // /blog -> page:blog:index
  // /blog/ -> page:blog:index
  // /blog/my-post -> page:blog:my-post
  // /blog/my-post/ -> page:blog:my-post
  // /blog/admin/index.html -> page:blog:admin/index.html
  // /blog/feed.xml -> page:blog:feed.xml
  // /blog/admin/config.yml -> page:blog:admin/config.yml

  // Redirect /blog/admin to /blog/admin/ so relative paths (config.yml) resolve correctly
  if (path === "/blog/admin") {
    return Response.redirect(new URL("/blog/admin/", "https://poha.ink").toString(), 301);
  }

  let slug = path.replace(/^\/blog\/?/, "").replace(/\/$/, "");
  if (!slug) slug = "index";

  const ext = slug.includes(".") ? slug.substring(slug.lastIndexOf(".")) : "";
  const kvKey = `page:blog:${slug}`;

  // Determine content type
  const contentType = ext ? (BLOG_MIME_TYPES[ext] || "application/octet-stream") : "text/html;charset=utf-8";
  const isBinary = contentType.startsWith("image/");

  const value = await env.PAGES.get(kvKey, isBinary ? "arrayBuffer" : "text");
  if (!value) {
    return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain" } });
  }

  // YAML config for Decap CMS
  const finalType = ext === ".yml" ? "text/yaml;charset=utf-8" : contentType;

  return new Response(value as ArrayBuffer | string, {
    headers: {
      "Content-Type": finalType,
      "Cache-Control": ext ? "public, max-age=3600" : "public, max-age=300",
    },
  });
}

async function servePage(
  env: Env,
  route: { key: string; type: string; cache: string },
): Promise<Response> {
  const value = await env.PAGES.get(route.key, route.type.startsWith("image/") ? "arrayBuffer" : "text");
  if (!value) {
    return new Response("Page not deployed yet.", { status: 404 });
  }
  return new Response(value as ArrayBuffer | string, {
    headers: {
      "Content-Type": route.type,
      "Cache-Control": route.cache,
    },
  });
}

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

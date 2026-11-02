import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Security headers on every response the app serves.
// The CSP allows only the origins the site really uses: Supabase (data, auth,
// storage, edge functions), Google Fonts, and the consent-gated Google Analytics
// and Meta Pixel. Inline scripts stay allowed because SSR hydration needs them.
// ---------------------------------------------------------------------------
const SUPABASE_ORIGIN = "https://lvfbvjdxwlnpivxrsmmi.supabase.co";
const PRODUCTION_HOSTS = new Set(["radicstudio.lovable.app"]);

function contentSecurityPolicy(framed: boolean, local: boolean): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    `connect-src 'self' ${local ? "http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:* " : ""}${SUPABASE_ORIGIN} wss://lvfbvjdxwlnpivxrsmmi.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.facebook.com https://connect.facebook.net`,
    "frame-src 'self' https://www.facebook.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // The live site may never be framed (clickjacking). Preview hosts stay
    // frameable by the Lovable editor and preview environments.
    framed
      ? "frame-ancestors 'self' https://lovable.dev https://*.lovable.dev https://*.google.com https://*.run.app"
      : "frame-ancestors 'none'",
    local ? "" : "upgrade-insecure-requests",
  ]
    .filter(Boolean)
    .join("; ");
}

function withSecurityHeaders(request: Request, response: Response): Response {
  const host = new URL(request.url).hostname;
  const production = PRODUCTION_HOSTS.has(host);
  const headers = new Headers(response.headers);
  const local = host === "localhost" || host === "127.0.0.1";
  headers.set("Content-Security-Policy", contentSecurityPolicy(!production, local));
  headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  );
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  if (production) headers.set("X-Frame-Options", "DENY");
  headers.delete("X-Powered-By");
  headers.delete("X-AspNet-Version");
  // Private pages never get cached by shared caches or indexed.
  const path = new URL(request.url).pathname;
  if (path.startsWith("/admin") || path.startsWith("/q/")) {
    headers.set("Cache-Control", "no-store");
    headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return withSecurityHeaders(request, await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return withSecurityHeaders(
        request,
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
    }
  },
};

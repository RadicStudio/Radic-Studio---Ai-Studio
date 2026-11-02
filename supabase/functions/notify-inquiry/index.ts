// Emails the studio about a new inquiry saved by the website.
// Deployed to Supabase as the `notify-inquiry` edge function (verify_jwt: false).
// The caller sends only the inquiry id. The function reads the saved row with the service role,
// so it can only ever email about a real inquiry that passed the database checks and rate limits,
// at most once, and only within 15 minutes of it being saved.
// Requires secrets: RESEND_API_KEY and optionally CONTACT_TO_EMAIL.

// ---- Request guard: allowed origins (CORS), client IP and rate limits ------------------
const ALLOWED_ORIGINS = [
  /^https:\/\/radicstudio\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/,
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
];
const CORS_BASE = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};
const originAllowed = (o: string | null) => !o || ALLOWED_ORIGINS.some((r) => r.test(o));
const clientIp = (req: Request) =>
  (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    "unknown"
  ).trim();

/** Counts a hit in the database limiter; true = allowed. Fails open so a limiter outage never breaks the site. */
async function rateOk(key: string, max: number, seconds: number): Promise<boolean> {
  const url = Deno.env.get("SUPABASE_URL");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !service) return true;
  try {
    const r = await fetch(`${url}/rest/v1/rpc/edge_rate_ok`, {
      method: "POST",
      headers: {
        apikey: service,
        Authorization: `Bearer ${service}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_key: key, p_max: max, p_seconds: seconds }),
    });
    if (!r.ok) return true;
    return (await r.json()) !== false;
  } catch {
    return true;
  }
}

/** Wraps a handler: rejects foreign origins, answers preflight, adds CORS for allowed origins. */
function serveGuarded(handle: (req: Request) => Promise<Response>) {
  Deno.serve(async (req: Request) => {
    const origin = req.headers.get("Origin");
    if (!originAllowed(origin)) {
      return new Response(JSON.stringify({ error: "Origin not allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json", Vary: "Origin" },
      });
    }
    const cors: Record<string, string> = {
      ...CORS_BASE,
      ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
    };
    if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
    if (req.method !== "POST")
      return new Response("Method not allowed", { status: 405, headers: cors });
    const res = await handle(req);
    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries(cors)) headers.set(k, v);
    headers.set("X-Content-Type-Options", "nosniff");
    return new Response(res.body, { status: res.status, headers });
  });
}
// -----------------------------------------------------------------------------------------

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

serveGuarded(async (req) => {
  if (!(await rateOk(`notify-inquiry:ip:${clientIp(req)}`, 10, 600)))
    return json({ error: "Too many requests" }, 429);

  let body: { id?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }
  const id = String(body.id ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    return json({ error: "Bad id" }, 400);

  const url = Deno.env.get("SUPABASE_URL");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const to = Deno.env.get("CONTACT_TO_EMAIL") ?? "radic.studio@gmail.com";
  if (!url || !service) return json({ error: "Not configured" }, 500);
  const h = {
    apikey: service,
    Authorization: `Bearer ${service}`,
    "Content-Type": "application/json",
  };

  // Claim the row atomically: only an un-notified inquiry from the last 15 minutes.
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const claim = await fetch(
    `${url}/rest/v1/inquiries?id=eq.${id}&notified_at=is.null&created_at=gte.${encodeURIComponent(since)}&select=name,email,budget_range,message,source`,
    {
      method: "PATCH",
      headers: { ...h, Prefer: "return=representation" },
      body: JSON.stringify({ notified_at: new Date().toISOString() }),
    },
  );
  const rows = (await claim.json()) as Array<Record<string, string | null>>;
  const q = Array.isArray(rows) ? rows[0] : undefined;
  if (!q) return json({ skipped: "not found or already sent" });
  if (!apiKey) return json({ skipped: "RESEND_API_KEY not set" });

  const email = q.email && /^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]{2,}$/.test(q.email) ? q.email : "";
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#141414;line-height:1.5">
      <p style="font-size:12px;letter-spacing:.2em;color:#6b6b6b;text-transform:uppercase">New inquiry · Radic Studio</p>
      <h2 style="margin:4px 0 16px">${esc(q.name)}</h2>
      ${email ? `<p><b>Email:</b> <a href="mailto:${esc(email)}">${esc(email)}</a></p>` : ""}
      ${q.budget_range ? `<p><b>Budget:</b> ${esc(q.budget_range)}</p>` : ""}
      <p><b>From:</b> ${esc(q.source)}</p>
      <p style="white-space:pre-wrap;border-left:3px solid #141414;padding-left:12px;margin-top:16px">${esc(String(q.message ?? "").slice(0, 5000))}</p>
      <p style="color:#6b6b6b;font-size:12px;margin-top:24px">Reply to this email to answer directly. The message is also in your studio panel under Inquiries.</p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Radic Studio Website <onboarding@resend.dev>",
      to: [to],
      ...(email ? { reply_to: email } : {}),
      subject: `New inquiry from ${String(q.name ?? "")
        .replace(/[\r\n]/g, " ")
        .slice(0, 80)}`,
      html,
    }),
  });
  return json({ sent: res.ok }, res.ok ? 200 : 502);
});

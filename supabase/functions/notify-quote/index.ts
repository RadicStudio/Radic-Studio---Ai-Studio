// Emails the studio when a client signs or declines a quote.
// The signature is already saved by the database function; this is best-effort.
// Deployed to Supabase as the `notify-quote` edge function (verify_jwt: false).
// Uses RESEND_API_KEY (and optionally CONTACT_TO_EMAIL) plus the built-in service role key.

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const naira = (n: number) =>
  `₦${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(Math.round(n))}`;

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

type Item = { description?: string; qty?: number; unit_price?: number };

serveGuarded(async (req: Request) => {
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

  let body: { token?: string; event?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }
  const token = String(body.token ?? "").replace(/[^a-f0-9]/gi, "");
  if (token.length < 32) return json({ error: "Bad token" }, 400);
  if (!(await rateOk(`notify-quote:ip:${clientIp(req)}`, 10, 600)))
    return json({ error: "Too many requests" }, 429);

  const url = Deno.env.get("SUPABASE_URL");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const to = Deno.env.get("CONTACT_TO_EMAIL") ?? "radic.studio@gmail.com";
  if (!url || !service) return json({ error: "Not configured" }, 500);

  const res = await fetch(
    `${url}/rest/v1/quotes?token=eq.${token}&select=number,status,client_name,client_business,project_title,items,discount,deposit_percent,signer_name,signer_email,signed_at,internal_notes,id`,
    { headers: { apikey: service, Authorization: `Bearer ${service}` } },
  );
  const rows = (await res.json()) as Array<Record<string, unknown>>;
  const q = rows?.[0];
  if (!q) return json({ error: "Not found" }, 404);

  // Only send for the state the quote is really in (stops anyone triggering fake emails).
  const status = String(q.status);
  if (!["signed", "declined"].includes(status)) return json({ skipped: `status ${status}` });
  // One email per quote per outcome, however often this is called.
  if (!(await rateOk(`notify-quote:${token}:${status}`, 1, 30 * 24 * 3600)))
    return json({ skipped: "already sent" });
  if (!apiKey) return json({ skipped: "RESEND_API_KEY not set" });

  const items = (q.items as Item[]) ?? [];
  const subtotal = items.reduce(
    (s, it) => s + (Number(it.qty) || 0) * (Number(it.unit_price) || 0),
    0,
  );
  const total = subtotal - Math.min(Number(q.discount) || 0, subtotal);
  const deposit = Math.round((total * (Number(q.deposit_percent) || 0)) / 100);
  const who = q.client_business ? `${q.client_name} (${q.client_business})` : q.client_name;
  const signed = status === "signed";

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#141414;line-height:1.5;max-width:560px">
      <p style="font-size:12px;letter-spacing:.2em;color:#6b6b6b;text-transform:uppercase">Quote ${esc(q.number)} · Radic Studio</p>
      <h2 style="margin:4px 0 12px">${signed ? "Signed" : "Declined"}: ${esc(q.project_title)}</h2>
      <p><b>Client:</b> ${esc(who)}</p>
      ${signed ? `<p><b>Signed by:</b> ${esc(q.signer_name)}${q.signer_email ? ` · <a href="mailto:${esc(q.signer_email)}">${esc(q.signer_email)}</a>` : ""}</p>` : ""}
      <p><b>Total:</b> ${naira(total)} · <b>Deposit due:</b> ${naira(deposit)}</p>
      ${!signed && q.internal_notes ? `<p style="white-space:pre-wrap;border-left:3px solid #141414;padding-left:12px">${esc(q.internal_notes)}</p>` : ""}
      <p style="margin-top:20px"><a href="https://radicstudio.lovable.app/admin/quotes/${esc(q.id)}" style="background:#141414;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">Open in the studio panel</a></p>
      <p style="color:#6b6b6b;font-size:12px;margin-top:20px">${signed ? "Next: confirm the deposit, then mark the quote paid in full when the balance lands to issue the certificate." : "The client's reason, if they gave one, is in the quote's private notes."}</p>
    </div>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Radic Studio Website <onboarding@resend.dev>",
      to: [to],
      ...(q.signer_email ? { reply_to: q.signer_email } : {}),
      subject: `${signed ? "Signed" : "Declined"}: quote ${q.number} · ${who}`,
      html,
    }),
  });
  return json({ sent: r.ok }, r.ok ? 200 : 502);
});

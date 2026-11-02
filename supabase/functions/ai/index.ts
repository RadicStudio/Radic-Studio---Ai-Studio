// AI helpers for the Radic Studio site, powered by Google's Gemini API (free tier).
// Deployed to Supabase as the `ai` edge function (verify_jwt: false; admin actions check the
// caller's session themselves). Requires secret GEMINI_API_KEY (https://aistudio.google.com).
//
// Actions:
//   brief    (public) — chat that turns a rough idea into a structured project brief
//   describe (admin)  — write title / summary / description / alt text from a cover image
//   reply    (admin)  — draft a reply to an inquiry

import { createClient } from "npm:@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

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

// Models to try, in order. The first is configurable; the rest are fallbacks in case Google
// retires or renames a model (the free tier changes often).
const MODELS = [
  ...(Deno.env.get("GEMINI_MODEL") ? [Deno.env.get("GEMINI_MODEL")!] : []),
  "gemini-3.8-flash",
  "gemini-3.8-flash-lite",
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
  "gemini-2.5-flash",
].filter((m, i, a) => a.indexOf(m) === i);

// Give each model this long before moving on; Supabase kills the whole request at 150 s.
const PER_MODEL_TIMEOUT_MS = 20_000;

type Part = { text: string } | { inline_data: { mime_type: string; data: string } };
type Msg = { role: "user" | "model"; parts: Part[] };

// Errors that mean "try another model": the model is gone, or it is overloaded / rate-limited.
function shouldTryNext(status: number, message: string) {
  return (
    status === 404 ||
    status === 429 ||
    status === 503 ||
    /not found|not supported|deprecated|retired|no longer available|high demand|overloaded|quota/i.test(
      message,
    )
  );
}

async function gemini(system: string, contents: Msg[], jsonMode = true): Promise<string> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  let lastError = "Gemini request failed";
  for (const model of MODELS) {
    let res: Response;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          signal: AbortSignal.timeout(PER_MODEL_TIMEOUT_MS),
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: system }] },
            contents,
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 1600,
              ...(jsonMode ? { response_mime_type: "application/json" } : {}),
            },
          }),
        },
      );
    } catch (e) {
      lastError = `${model} did not answer in time`;
      console.error(`[ai] ${model} -> ${(e as Error).name}: ${(e as Error).message}`);
      continue; // try the next model
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      lastError = data?.error?.message ?? `Gemini error ${res.status}`;
      console.error(`[ai] ${model} -> ${res.status}: ${lastError}`);
      if (shouldTryNext(res.status, lastError)) continue; // try the next model
      throw new Error(lastError);
    }
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ??
      "";
    if (!text) {
      const reason =
        data?.candidates?.[0]?.finishReason ?? data?.promptFeedback?.blockReason ?? "empty";
      console.error(`[ai] ${model} returned no text (${reason})`);
      throw new Error("The model returned no text; please try again.");
    }
    return text;
  }
  throw new Error(
    /high demand|overloaded|quota|429|503|in time/i.test(lastError)
      ? "The assistant is busy right now — please try again in a moment."
      : lastError,
  );
}

async function imagePart(url: string): Promise<Part> {
  const r = await fetch(url);
  if (!r.ok) throw new Error("Could not fetch the image");
  const mime = r.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  const buf = new Uint8Array(await r.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000)
    bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return { inline_data: { mime_type: mime, data: btoa(bin) } };
}

async function isAdmin(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization");
  if (!auth) return false;
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data, error } = await sb.rpc("is_admin");
  return !error && data === true;
}

const STUDIO = `Radic Studio is a Nigerian design company (tagline: lux . radix . creatio — light, root, creation).
Crafts, in order of focus: UI/UX design (websites, web apps, mobile apps), brand identity, print & packaging (tickets, banners, flyers, stationery, labels), event campaigns, social media content, illustration and motion.
Voice: short, confident, plain English. Never use the words "elevate", "unleash", "seamless" or "cutting-edge".`;

const BRIEF_SYSTEM = `${STUDIO}
You are the studio's intake assistant on its website. A prospective client describes what they need; you gather what a designer must know before quoting, then write the brief.

HOW TO ASK
- One message per turn, max 2 sentences, friendly and plain. You may bundle two closely related questions in one message ("What size will the banner be, and roughly how many tickets?").
- Ask 3 to 5 messages in total, never more than 5. Do not ask for budget. Do not repeat what the client already said. If something is unknown, write "to be confirmed" in the brief rather than asking twice.
- Before the brief, ask what the client already has: logo, brand colours, copy/text, photos, references.

WHAT TO PIN DOWN, BY KIND OF WORK
- UI/UX (website, web app, mobile app): what the product does and who uses it; platform (web, iOS, Android, responsive); rough scope — number of pages or screens, or the key flows (sign-up, checkout, dashboard); whether it is a redesign or new; existing brand; launch date.
- Brand identity: the business and what it sells; the audience; deliverables (logo only, logo + colours + type, full identity with stationery and social kit); competitors or references; deadline.
- Print (tickets, banners, flyers, packaging, stationery): exact items and quantities (e.g. 2 ticket tiers, 1 roll-up banner, 1 flyer); sizes or formats (A5, 6x3 ft, 1080x1350 px) or where they will be printed/displayed; copy and photos ready or not; print date; mood or references.
- Event campaign: event name, date and venue; audience; items needed (flyer, ticket, banner, Instagram set, stage screen); copy/photos ready; mood or references.
- Social media: platforms; how many posts/stories per week or month and for how long; brand assets exist or not; goal (launch, sales, awareness); start date.
- Illustration / motion: the subject, style references, where it is used (print, web, social, video), sizes or durations, deadline.

OUTPUT
Always answer as JSON. While asking: {"done": false, "message": "<your message>"}.
When finished: {"done": true, "message": "<one warm sentence confirming you have what you need>", "brief": "<plain text, one line each: Project, Type of work, Audience, Deliverables (with quantities), Sizes/formats, Where it will be used, Existing assets, Deadline, Mood/references, Notes>", "package": "<Starter|Studio|Partner|Custom>", "package_reason": "<one sentence>"}.
Packages: Starter = one or two items (a flyer, a ticket set, a logo refresh, a landing page); Studio = a connected set (full identity, an event campaign with print + social, a 5–8 page website or an app with a few key flows); Partner = ongoing monthly content, or a full brand plus website/app. Custom when unsure.`;

const DESCRIBE_SYSTEM = `${STUDIO}
You write portfolio copy for the studio's website from an image of the work. Be specific about what you can actually see (colours, type, composition, the kind of piece). Do not invent client facts that are not given. Answer as JSON:
{"title": "<Client or subject — what it is, max 60 chars>", "summary": "<one sentence, max 140 chars>", "description": "<markdown with ## The brief, ## The idea, ## Delivered sections, 60-120 words total>", "alt": "<alt text describing the image, max 120 chars>", "tags": ["<2-4 category-style tags>"]}`;

const REPLY_SYSTEM = `${STUDIO}
Draft a reply from the studio to a client inquiry. Warm, brief (90-140 words), no bullet lists. Thank them, reflect back what they asked for in one line, ask any one missing question that matters, propose a next step (a short WhatsApp call or sending references), and sign off as "Radic Studio". Answer as JSON: {"subject": "<reply subject>", "body": "<the email text>"}`;

serveGuarded(async (req: Request) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }
  const action = String(body.action ?? "");

  try {
    if (action === "brief") {
      // Public chat: 30 turns per visitor per 10 minutes, 600 per day site-wide (protects the free quota).
      if (
        !(await rateOk(`ai:brief:ip:${clientIp(req)}`, 30, 600)) ||
        !(await rateOk("ai:brief:all", 600, 86400))
      ) {
        return json(
          { error: "The assistant is busy right now — please try again in a few minutes." },
          429,
        );
      }
      const history = (Array.isArray(body.messages) ? body.messages : []) as {
        role: string;
        text: string;
      }[];
      if (!history.length || history.length > 16) return json({ error: "Send 1–16 messages" }, 400);
      const contents: Msg[] = history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.text).slice(0, 1500) }],
      }));
      const out = JSON.parse(await gemini(BRIEF_SYSTEM, contents));
      return json(out);
    }

    if (action === "describe" || action === "reply") {
      if (!(await isAdmin(req))) return json({ error: "Admin only" }, 401);
    }

    if (action === "describe") {
      const url = String(body.image_url ?? "");
      if (!/^https:\/\//.test(url)) return json({ error: "image_url must be https" }, 400);
      const hints = String(body.hints ?? "").slice(0, 600);
      const contents: Msg[] = [
        {
          role: "user",
          parts: [
            await imagePart(url),
            {
              text: `Write the portfolio copy for this piece.${hints ? ` Known facts: ${hints}` : ""}`,
            },
          ],
        },
      ];
      return json(JSON.parse(await gemini(DESCRIBE_SYSTEM, contents)));
    }

    if (action === "reply") {
      const q = body.inquiry as
        { name?: string; email?: string; budget_range?: string; message?: string } | undefined;
      if (!q?.message) return json({ error: "inquiry required" }, 400);
      const contents: Msg[] = [
        {
          role: "user",
          parts: [
            {
              text: `Inquiry from ${q.name ?? "a client"}${q.budget_range ? ` (budget: ${q.budget_range})` : ""}:\n\n${String(q.message).slice(0, 3000)}`,
            },
          ],
        },
      ];
      return json(JSON.parse(await gemini(REPLY_SYSTEM, contents)));
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error(`[ai] ${action} failed: ${(e as Error).message}`);
    return json({ error: (e as Error).message }, 500);
  }
});

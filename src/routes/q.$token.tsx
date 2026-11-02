import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Download, MessageCircle, PenLine, Type } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { CertificateDocument, QuoteDocument } from "@/components/quote/QuoteDocument";
import { whatsappLink } from "@/lib/format";
import { dateTime, naira, quoteTotals } from "@/lib/quotes";
import { useSiteShell } from "@/lib/site";
import { getSupabase, SUPABASE_URL, SUPABASE_KEY } from "@/lib/supabase";
import type { PublicQuote } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/q/$token")({
  head: () => ({
    meta: [
      { title: "Your quote — Radic Studio" },
      // Private link: keep it out of search engines.
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: QuotePage,
});

function QuotePage() {
  const { token } = Route.useParams();
  const { settings } = useSiteShell();
  const [quote, setQuote] = useState<PublicQuote | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Load in the browser only, so link previews in WhatsApp don't count as the client opening it.
  useEffect(() => {
    let alive = true;
    getSupabase()
      .rpc("get_quote", { p_token: token })
      .then(({ data, error: e }) => {
        if (!alive) return;
        if (e) setError(e.message);
        setQuote((data as PublicQuote | null) ?? null);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  if (quote === undefined && !error) {
    return (
      <Shell>
        <p className="py-32 text-center text-sm text-graphite">Opening your quote…</p>
      </Shell>
    );
  }
  if (!quote) {
    return (
      <Shell>
        <div className="mx-auto max-w-md py-32 text-center">
          <h1 className="display-wide text-3xl">This link isn't working</h1>
          <p className="mt-3 text-graphite">
            The quote may have been replaced or the link copied incompletely. Message us and we'll
            resend it.
          </p>
          <a
            href={whatsappLink(
              settings.whatsapp_number,
              "Hi Radic Studio, my quote link isn't opening.",
            )}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper"
          >
            <MessageCircle className="h-4 w-4" /> Message us on WhatsApp
          </a>
        </div>
      </Shell>
    );
  }

  const t = quoteTotals(quote);
  const canSign = quote.status === "sent" || quote.status === "viewed";

  return (
    <Shell>
      <div className="no-print mx-auto mb-6 flex max-w-[820px] flex-wrap items-center justify-between gap-3 px-1">
        <Link to="/" className="text-sm text-graphite hover:text-ink">
          ← radicstudio.lovable.app
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm"
        >
          <Download className="h-4 w-4" /> Save as PDF
        </button>
      </div>

      {quote.status === "signed" && (
        <Banner tone="good">
          Signed by {quote.signer_name} on {dateTime(quote.signed_at)}. Pay the {naira(t.deposit)}{" "}
          deposit below and we'll start.
        </Banner>
      )}
      {quote.status === "paid" && (
        <Banner tone="good">Paid in full. Your certificate of ownership is below the quote.</Banner>
      )}
      {quote.status === "expired" && (
        <Banner tone="warn">
          This quote has expired. Message us and we'll send an updated one.
        </Banner>
      )}
      {quote.status === "declined" && (
        <Banner tone="warn">
          You declined this quote. Message us if you'd like a different option.
        </Banner>
      )}

      <QuoteDocument quote={quote} settings={settings} />

      {canSign && (
        <SignPanel
          token={token}
          clientName={quote.client_name}
          clientEmail={quote.client_email}
          onSigned={(q) => setQuote(q)}
          onDeclined={(q) => setQuote(q)}
        />
      )}

      {quote.status === "signed" && (
        <PayPanel quote={quote} deposit={t.deposit} settings={settings} />
      )}

      <CertificateDocument quote={quote} settings={settings} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-surface px-3 py-8 sm:px-6 sm:py-14">{children}</div>;
}

function Banner({ tone, children }: { tone: "good" | "warn"; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "no-print mx-auto mb-6 flex max-w-[820px] items-start gap-3 rounded-2xl px-5 py-4 text-sm",
        tone === "good" ? "bg-ink text-paper" : "bg-white text-ink",
      )}
    >
      {tone === "good" && <Check className="mt-0.5 h-4 w-4 shrink-0" />}
      <p>{children}</p>
    </div>
  );
}

function SignPanel({
  token,
  clientName,
  clientEmail,
  onSigned,
  onDeclined,
}: {
  token: string;
  clientName: string;
  clientEmail: string | null;
  onSigned: (q: PublicQuote) => void;
  onDeclined: (q: PublicQuote) => void;
}) {
  const [name, setName] = useState(clientName);
  const [email, setEmail] = useState(clientEmail ?? "");
  const [mode, setMode] = useState<"typed" | "drawn">("typed");
  const [typed, setTyped] = useState(clientName);
  const [drawn, setDrawn] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");

  const signature = mode === "typed" ? typed.trim() : drawn;
  const ready = agree && name.trim().length > 1 && Boolean(signature);

  async function sign() {
    if (!ready || !signature) return;
    setBusy(true);
    setErr(null);
    const { data, error } = await getSupabase().rpc("sign_quote", {
      p_token: token,
      p_name: name.trim(),
      p_email: email.trim(),
      p_kind: mode,
      p_signature: signature,
      p_agent: navigator.userAgent,
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    // Tell the studio (best effort; the signature is already saved).
    fetch(`${SUPABASE_URL}/functions/v1/notify-quote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ token, event: "signed" }),
    }).catch(() => {});
    onSigned(data as PublicQuote);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function decline() {
    setBusy(true);
    const { data, error } = await getSupabase().rpc("decline_quote", {
      p_token: token,
      p_reason: reason,
    });
    setBusy(false);
    if (error) return setErr(error.message);
    fetch(`${SUPABASE_URL}/functions/v1/notify-quote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ token, event: "declined" }),
    }).catch(() => {});
    onDeclined(data as PublicQuote);
  }

  return (
    <section className="no-print mx-auto mt-8 w-full max-w-[820px] rounded-[28px] bg-white p-6 sm:p-10">
      <p className="text-[11px] font-medium tracking-[0.2em] text-graphite uppercase">
        Accept this quote
      </p>
      <h2 className="display-wide mt-2 text-2xl sm:text-3xl">
        Sign below to <span className="serif-note">start</span>.
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-graphite">Your full name</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (mode === "typed" && (typed === "" || typed === name)) setTyped(e.target.value);
            }}
            className="mt-1.5 h-12 w-full rounded-xl border border-mist bg-paper px-4 text-base outline-none focus:border-ink"
            autoComplete="name"
          />
        </label>
        <label className="block text-sm">
          <span className="text-graphite">Email for your copy</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 h-12 w-full rounded-xl border border-mist bg-paper px-4 text-base outline-none focus:border-ink"
            autoComplete="email"
          />
        </label>
      </div>

      <div className="mt-6 inline-flex rounded-full bg-surface p-1 text-sm">
        <ModeButton active={mode === "typed"} onClick={() => setMode("typed")}>
          <Type className="h-4 w-4" /> Type
        </ModeButton>
        <ModeButton active={mode === "drawn"} onClick={() => setMode("drawn")}>
          <PenLine className="h-4 w-4" /> Draw
        </ModeButton>
      </div>

      <div className="mt-4">
        {mode === "typed" ? (
          <div className="rounded-2xl border border-mist bg-paper p-4">
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type your name"
              aria-label="Signature"
              className="serif-note w-full bg-transparent text-4xl leading-tight outline-none placeholder:text-mist"
            />
          </div>
        ) : (
          <DrawPad onChange={setDrawn} />
        )}
      </div>

      <label className="mt-6 flex items-start gap-3 text-sm leading-relaxed">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="mt-1 h-4 w-4 accent-ink"
        />
        <span>
          I accept this quote and Radic Studio's{" "}
          <Link to="/terms" target="_blank" className="font-medium underline underline-offset-4">
            terms and rights of use
          </Link>
          , and I agree that signing here is the same as signing on paper.
        </span>
      </label>

      {err && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={!ready || busy}
          onClick={sign}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold text-paper transition disabled:opacity-40"
        >
          {busy ? "Signing…" : "Sign and accept"}
        </button>
        <button
          type="button"
          onClick={() => setDeclining((v) => !v)}
          className="text-sm text-graphite underline-offset-4 hover:underline"
        >
          Not right for you?
        </button>
      </div>
      <p className="mt-4 text-xs text-graphite">
        We record your name, the time and the device you sign from, and keep them with this quote.
      </p>

      {declining && (
        <div className="mt-6 rounded-2xl bg-surface p-4">
          <label className="block text-sm">
            <span className="text-graphite">What would make it work? (optional)</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-mist bg-white p-3 text-sm outline-none focus:border-ink"
            />
          </label>
          <button
            type="button"
            onClick={decline}
            disabled={busy}
            className="mt-3 rounded-full border border-ink px-4 py-2 text-sm font-medium"
          >
            Decline this quote
          </button>
        </div>
      )}
    </section>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium transition",
        active ? "bg-ink text-paper" : "text-graphite",
      )}
    >
      {children}
    </button>
  );
}

function DrawPad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ratio = window.devicePixelRatio || 1;
    const w = c.clientWidth;
    const h = c.clientHeight;
    c.width = w * ratio;
    c.height = h * ratio;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = "#141414";
  }, []);

  const point = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <div className="rounded-2xl border border-mist bg-paper p-2">
      <canvas
        ref={ref}
        className="h-44 w-full touch-none rounded-xl bg-white"
        aria-label="Draw your signature"
        onPointerDown={(e) => {
          const ctx = e.currentTarget.getContext("2d");
          if (!ctx) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drawing.current = true;
          const p = point(e);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = e.currentTarget.getContext("2d");
          if (!ctx) return;
          const p = point(e);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }}
        onPointerUp={(e) => {
          if (!drawing.current) return;
          drawing.current = false;
          setEmpty(false);
          onChange(e.currentTarget.toDataURL("image/png"));
        }}
      />
      <div className="flex items-center justify-between px-2 pt-2 text-xs text-graphite">
        <span>{empty ? "Sign with your finger or mouse" : "Looks good"}</span>
        <button
          type="button"
          onClick={() => {
            const c = ref.current;
            const ctx = c?.getContext("2d");
            if (c && ctx) ctx.clearRect(0, 0, c.width, c.height);
            setEmpty(true);
            onChange(null);
          }}
          className="font-medium text-ink"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

function PayPanel({
  quote,
  deposit,
  settings,
}: {
  quote: PublicQuote;
  deposit: number;
  settings: ReturnType<typeof useSiteShell>["settings"];
}) {
  const hasBank = settings.bank_account_number && settings.bank_name;
  return (
    <section className="no-print mx-auto mt-8 w-full max-w-[820px] rounded-[28px] bg-ink p-6 text-paper sm:p-10">
      <p className="text-[11px] font-medium tracking-[0.2em] text-paper/60 uppercase">Next step</p>
      <h2 className="display-wide mt-2 text-2xl sm:text-3xl">
        Pay the {naira(deposit)} deposit to <span className="serif-note">begin</span>.
      </h2>
      <div className="mt-6 flex flex-wrap gap-3">
        {quote.payment_link && (
          <a
            href={quote.payment_link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center rounded-full bg-paper px-6 text-[15px] font-semibold text-ink"
          >
            Pay deposit online
          </a>
        )}
        <a
          href={whatsappLink(
            settings.whatsapp_number,
            `Hi Radic Studio, I've signed quote ${quote.number} and paid the ${naira(deposit)} deposit. Here's my receipt:`,
          )}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-12 items-center gap-2 rounded-full border border-paper/30 px-6 text-[15px] font-semibold"
        >
          <MessageCircle className="h-4 w-4" /> Send receipt on WhatsApp
        </a>
      </div>
      {hasBank && (
        <dl className="mt-8 grid gap-4 rounded-2xl bg-paper/5 p-5 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-paper/60">Bank</dt>
            <dd className="mt-1 font-medium">{settings.bank_name}</dd>
          </div>
          <div>
            <dt className="text-paper/60">Account name</dt>
            <dd className="mt-1 font-medium">{settings.bank_account_name}</dd>
          </div>
          <div>
            <dt className="text-paper/60">Account number</dt>
            <dd className="mt-1 font-medium tabular-nums">{settings.bank_account_number}</dd>
          </div>
        </dl>
      )}
      <p className="mt-6 text-sm text-paper/60">
        Use {quote.number} as the payment reference. We confirm every payment in writing.
      </p>
    </section>
  );
}

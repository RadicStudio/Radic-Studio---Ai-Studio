import { Link } from "@tanstack/react-router";

import { TERMS_SUMMARY, longDate, naira, quoteTotals, STATUS_LABEL } from "@/lib/quotes";
import type { PublicQuote, SiteSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

/** The branded quote sheet. Used on the client's quote page and in the admin preview. */
export function QuoteDocument({
  quote,
  settings,
  className,
}: {
  quote: PublicQuote;
  settings: Pick<SiteSettings, "studio_name" | "email" | "phone" | "address">;
  className?: string;
}) {
  const t = quoteTotals(quote);
  const items = quote.items ?? [];
  const signed = Boolean(quote.signed_at);

  return (
    <article
      className={cn(
        "quote-sheet mx-auto w-full max-w-[820px] rounded-[28px] bg-white p-6 text-ink shadow-[0_1px_0_rgba(0,0,0,0.04),0_24px_60px_-30px_rgba(0,0,0,0.25)] sm:p-12",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-mist pb-8">
        <div>
          <img src="/brand/logo-primary.png" alt={settings.studio_name} className="h-9 w-auto" />
          <p className="mt-4 text-xs leading-relaxed text-graphite">
            {settings.email && <span className="block">{settings.email}</span>}
            {settings.phone && <span className="block">{settings.phone}</span>}
            <span className="block">radicstudio.lovable.app</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium tracking-[0.2em] text-graphite uppercase">Quote</p>
          <p className="font-display mt-1 text-2xl font-semibold tracking-tight">{quote.number}</p>
          <p className="mt-2 inline-flex rounded-full bg-surface px-3 py-1 text-xs font-medium text-ink">
            {STATUS_LABEL[quote.status]}
          </p>
        </div>
      </header>

      <section className="grid gap-6 py-8 sm:grid-cols-3">
        <Meta label="Prepared for">
          <span className="font-medium">{quote.client_name || "—"}</span>
          {quote.client_business && <span className="block">{quote.client_business}</span>}
          {quote.client_email && <span className="block text-graphite">{quote.client_email}</span>}
        </Meta>
        <Meta label="Date">{longDate(quote.sent_at ?? quote.created_at)}</Meta>
        <Meta label="Valid until">{quote.valid_until ? longDate(quote.valid_until) : "—"}</Meta>
      </section>

      <section>
        <h1 className="display-wide text-3xl leading-[1.05] sm:text-[2.6rem]">
          {quote.project_title || "Project"}
        </h1>
        {quote.summary && (
          <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-graphite">
            {quote.summary}
          </p>
        )}
      </section>

      <section className="mt-8">
        <div className="hidden grid-cols-[1fr_64px_120px_120px] gap-4 border-b border-ink pb-2 text-[11px] font-medium tracking-[0.14em] text-graphite uppercase sm:grid">
          <span>What's included</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Price</span>
          <span className="text-right">Amount</span>
        </div>
        <ul>
          {items.map((it, i) => (
            <li
              key={i}
              className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-b border-mist py-4 sm:grid-cols-[1fr_64px_120px_120px]"
            >
              <div>
                <p className="font-medium">{it.description}</p>
                {it.detail && <p className="mt-0.5 text-sm text-graphite">{it.detail}</p>}
              </div>
              <span className="hidden text-right tabular-nums sm:block">{it.qty}</span>
              <span className="hidden text-right tabular-nums sm:block">
                {naira(Number(it.unit_price) || 0)}
              </span>
              <span className="text-right font-medium tabular-nums">
                {naira((Number(it.qty) || 0) * (Number(it.unit_price) || 0))}
                <span className="block text-xs font-normal text-graphite sm:hidden">
                  {it.qty} × {naira(Number(it.unit_price) || 0)}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 ml-auto w-full max-w-xs space-y-1.5 text-sm">
          {t.discount > 0 && (
            <>
              <Row label="Subtotal" value={naira(t.subtotal)} />
              <Row label="Discount" value={`− ${naira(t.discount)}`} />
            </>
          )}
          <div className="flex items-baseline justify-between border-t border-ink pt-3">
            <dt className="font-medium">Total</dt>
            <dd className="font-display text-2xl font-semibold tabular-nums">{naira(t.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <Box label="To start">
          <span className="font-display text-xl font-semibold tabular-nums">
            {naira(t.deposit)}
          </span>
          <span className="block text-xs text-graphite">{quote.deposit_percent}% deposit</span>
        </Box>
        <Box label="Before final files">
          <span className="font-display text-xl font-semibold tabular-nums">
            {naira(t.balance)}
          </span>
          <span className="block text-xs text-graphite">balance</span>
        </Box>
        <Box label="Timeline">
          <span className="font-medium">{quote.timeline || "Agreed on signing"}</span>
          <span className="block text-xs text-graphite">
            {quote.revisions} rounds of changes included
          </span>
        </Box>
      </section>

      {quote.notes && (
        <section className="mt-8 rounded-2xl bg-surface p-5 text-sm leading-relaxed whitespace-pre-wrap">
          {quote.notes}
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-[11px] font-medium tracking-[0.2em] text-graphite uppercase">
          Terms in short
        </h2>
        <ul className="mt-3 space-y-1.5 text-sm leading-relaxed">
          {TERMS_SUMMARY.map((line) => (
            <li key={line} className="flex gap-3">
              <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink" />
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-graphite">
          Full terms and rights of use:{" "}
          <Link to="/terms" className="font-medium text-ink underline underline-offset-4">
            radicstudio.lovable.app/terms
          </Link>
        </p>
      </section>

      <section className="mt-10 grid gap-8 border-t border-mist pt-8 sm:grid-cols-2">
        <SignatureBlock
          label="For the client"
          name={quote.signer_name}
          date={quote.signed_at}
          kind={quote.signature_kind}
          data={quote.signature_data}
          empty={signed ? undefined : "Awaiting signature"}
        />
        <SignatureBlock
          label={`For ${settings.studio_name}`}
          name={quote.studio_signer}
          date={quote.sent_at ?? quote.created_at}
          kind="typed"
          data={quote.studio_signer.split(",")[0] ?? quote.studio_signer}
        />
      </section>
    </article>
  );
}

/** One-page ownership certificate, shown once the project is paid in full. */
export function CertificateDocument({
  quote,
  settings,
}: {
  quote: PublicQuote;
  settings: Pick<SiteSettings, "studio_name">;
}) {
  if (!quote.certificate_number) return null;
  const items = quote.items ?? [];
  return (
    <article className="quote-sheet certificate mx-auto mt-10 w-full max-w-[820px] rounded-[28px] bg-ink p-6 text-paper sm:p-12">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <img
          src="/brand/logo-primary.png"
          alt={settings.studio_name}
          className="h-9 w-auto invert"
        />
        <div className="text-right">
          <p className="text-[11px] font-medium tracking-[0.2em] text-paper/60 uppercase">
            Certificate of ownership
          </p>
          <p className="font-display mt-1 text-2xl font-semibold">{quote.certificate_number}</p>
        </div>
      </div>
      <h2 className="display-wide mt-10 text-3xl leading-[1.05] sm:text-[2.4rem]">
        This design now <span className="serif-note">belongs</span> to{" "}
        {quote.client_business || quote.client_name}.
      </h2>
      <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-paper/80">
        <p>
          {settings.studio_name} confirms that {quote.client_name}
          {quote.client_business ? ` (${quote.client_business})` : ""} has paid the full price for{" "}
          <span className="text-paper">{quote.project_title}</span>, quote {quote.number}
          {quote.signed_at ? `, signed ${longDate(quote.signed_at)}` : ""}.
        </p>
        <p>
          {settings.studio_name} hereby assigns to the client all copyright in the final approved
          deliverables listed below, for use in any medium, worldwide, with no time limit.
        </p>
        <ul className="space-y-1 text-paper">
          {items.map((it, i) => (
            <li key={i}>— {it.description}</li>
          ))}
        </ul>
        {quote.deliverables_note && (
          <p className="whitespace-pre-wrap">{quote.deliverables_note}</p>
        )}
        <p>
          {settings.studio_name} keeps the right to show the finished work in its portfolio once it
          is public, and keeps all drafts and concepts that were not chosen. Fonts, stock images and
          other third-party assets stay under their own licences.
        </p>
      </div>
      <div className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t border-paper/15 pt-6">
        <div>
          <p className="serif-note text-3xl">{quote.studio_signer.split(",")[0]}</p>
          <p className="mt-1 text-xs text-paper/60">
            {quote.studio_signer} · for {settings.studio_name}
          </p>
        </div>
        <p className="text-xs text-paper/60">
          Issued {longDate(quote.certificate_issued_at ?? quote.paid_at)}
        </p>
      </div>
    </article>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium tracking-[0.2em] text-graphite uppercase">{label}</p>
      <div className="mt-1.5 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function Box({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface p-4">
      <p className="text-[11px] font-medium tracking-[0.16em] text-graphite uppercase">{label}</p>
      <div className="mt-2 text-sm">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-graphite">
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function SignatureBlock({
  label,
  name,
  date,
  kind,
  data,
  empty,
}: {
  label: string;
  name: string | null;
  date: string | null;
  kind: "typed" | "drawn" | null;
  data: string | null;
  empty?: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium tracking-[0.2em] text-graphite uppercase">{label}</p>
      <div className="mt-3 flex h-20 items-end border-b border-ink pb-2">
        {empty ? (
          <span className="text-sm text-graphite">{empty}</span>
        ) : kind === "drawn" && data?.startsWith("data:image/") ? (
          <img src={data} alt={`Signature of ${name ?? ""}`} className="h-16 w-auto" />
        ) : (
          <span className="serif-note text-4xl leading-none">{data}</span>
        )}
      </div>
      {!empty && (
        <p className="mt-2 text-xs text-graphite">
          {name}
          {date ? ` · ${longDate(date)}` : ""}
        </p>
      )}
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Copy,
  ExternalLink,
  Eye,
  Mail,
  MessageCircle,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { TextAreaField, TextField } from "@/components/admin/Fields";
import { PageHeader } from "@/components/admin/Shell";
import { CertificateDocument, QuoteDocument } from "@/components/quote/QuoteDocument";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/format";
import { fetchSettings } from "@/lib/queries";
import {
  dateTime,
  naira,
  PACKAGES,
  quoteTotals,
  quoteUrl,
  STATUS_LABEL,
  STATUS_TONE,
} from "@/lib/quotes";
import { getSupabase } from "@/lib/supabase";
import { DEFAULT_SETTINGS, type Quote, type QuoteItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/quotes/$id")({ component: Page });

type Draft = Omit<Quote, "id" | "token" | "number" | "created_at" | "updated_at">;

function Page() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [preview, setPreview] = useState(false);

  const q = useQuery({
    queryKey: ["admin", "quote", id],
    queryFn: async () => {
      const { data, error } = await getSupabase().from("quotes").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Quote;
    },
  });
  const settings = useQuery({ queryKey: ["admin", "settings-lite"], queryFn: fetchSettings });

  const [d, setD] = useState<Quote | null>(null);
  useEffect(() => {
    if (q.data) setD({ ...q.data, items: q.data.items ?? [] });
  }, [q.data]);
  const set = (patch: Partial<Draft>) => setD((s) => (s ? { ...s, ...patch } : s));

  const save = useMutation({
    mutationFn: async (extra: Partial<Draft> = {}) => {
      if (!d) return;
      const {
        id: _id,
        token: _t,
        number: _n,
        created_at: _c,
        updated_at: _u,
        certificate_number: _cn,
        certificate_issued_at: _ci,
        ...rest
      } = { ...d, ...extra };
      const { error } = await getSupabase().from("quotes").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "quote", id] });
      qc.invalidateQueries({ queryKey: ["admin", "quotes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await getSupabase().from("quotes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "quotes"] });
      navigate({ to: "/admin/quotes" });
    },
  });

  if (q.isLoading || !d) return <p className="text-sm text-graphite">Loading…</p>;

  const t = quoteTotals(d);
  const link = quoteUrl(d.token);
  const locked = ["signed", "paid"].includes(d.status);
  const s = settings.data ?? DEFAULT_SETTINGS;
  const firstName = (d.client_name || "").split(" ")[0] || "there";
  const message = `Hi ${firstName}, here's your quote from Radic Studio for ${d.project_title}: ${naira(t.total)}, ${d.timeline || "timeline inside"}. You can read it and sign online here: ${link}`;

  const setItem = (i: number, patch: Partial<QuoteItem>) =>
    set({ items: d.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });

  async function markSent() {
    await save.mutateAsync({
      status: d!.status === "draft" ? "sent" : d!.status,
      sent_at: d!.sent_at ?? new Date().toISOString(),
    });
  }

  return (
    <div className="max-w-5xl">
      <Link
        to="/admin/quotes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-graphite hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> All quotes
      </Link>
      <PageHeader
        title={`Quote ${d.number}`}
        text={
          locked
            ? "Signed quotes are locked. Duplicate it to change the price."
            : "Changes save when you press Save."
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUS_TONE[d.status])}
            >
              {STATUS_LABEL[d.status]}
            </span>
            <Button variant="outline" onClick={() => setPreview((v) => !v)}>
              <Eye /> {preview ? "Edit" : "Preview"}
            </Button>
            {!locked && (
              <Button
                onClick={() => save.mutate({}, { onSuccess: () => toast.success("Saved") })}
                disabled={save.isPending}
              >
                {save.isPending ? "Saving…" : "Save"}
              </Button>
            )}
          </div>
        }
      />

      {/* Send / share */}
      <div className="mb-6 rounded-xl border border-mist bg-white p-4">
        <p className="text-sm font-medium text-ink">Send to the client</p>
        <p className="mt-1 text-xs text-graphite">
          The link only works once the quote is marked as sent. Clients can read, sign and see your
          payment details there.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={async () => {
              await markSent();
              await navigator.clipboard.writeText(link);
              toast.success("Marked as sent and link copied");
            }}
          >
            <Copy /> {d.status === "draft" ? "Mark sent & copy link" : "Copy link"}
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a
              href={whatsappLink(d.client_phone || "", message)}
              target="_blank"
              rel="noreferrer"
              onClick={() => markSent()}
            >
              <MessageCircle /> Send on WhatsApp
            </a>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a
              href={`mailto:${d.client_email ?? ""}?subject=${encodeURIComponent(`Your quote from Radic Studio — ${d.project_title}`)}&body=${encodeURIComponent(message)}`}
              onClick={() => markSent()}
            >
              <Mail /> Email
            </a>
          </Button>
          {d.status !== "draft" && (
            <Button size="sm" variant="ghost" asChild>
              <a href={link} target="_blank" rel="noreferrer">
                <ExternalLink /> Open client page
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Signature record + payment */}
      {(d.signed_at || d.status === "declined") && (
        <div className="mb-6 grid gap-4 rounded-xl border border-mist bg-white p-4 sm:grid-cols-[1fr_auto]">
          {d.signed_at ? (
            <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <Audit
                label="Signed by"
                value={`${d.signer_name}${d.signer_email ? ` · ${d.signer_email}` : ""}`}
              />
              <Audit label="Signed at" value={dateTime(d.signed_at)} />
              <Audit label="Signature" value={d.signature_kind === "drawn" ? "Drawn" : "Typed"} />
              <Audit label="IP address" value={d.signer_ip || "—"} />
              <Audit label="Device" value={d.signer_agent || "—"} wide />
              {d.paid_at && <Audit label="Paid" value={dateTime(d.paid_at)} />}
              {d.certificate_number && <Audit label="Certificate" value={d.certificate_number} />}
            </dl>
          ) : (
            <p className="text-sm text-graphite whitespace-pre-wrap">{d.internal_notes}</p>
          )}
          {d.status === "signed" && (
            <Button
              onClick={() =>
                save.mutate(
                  { status: "paid" },
                  {
                    onSuccess: () =>
                      toast.success("Marked paid. Certificate issued on the client's page."),
                  },
                )
              }
            >
              <BadgeCheck /> Mark paid in full
            </Button>
          )}
        </div>
      )}

      {preview ? (
        <div className="rounded-2xl bg-surface p-3 sm:p-6">
          <QuoteDocument quote={d} settings={s} />
          <CertificateDocument quote={d} settings={s} />
        </div>
      ) : (
        <fieldset disabled={locked} className="space-y-6 disabled:opacity-70">
          <Card title="Client">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Name"
                value={d.client_name}
                onChange={(v) => set({ client_name: v })}
              />
              <TextField
                label="Business"
                value={d.client_business}
                onChange={(v) => set({ client_business: v || null })}
              />
              <TextField
                label="Email"
                type="email"
                value={d.client_email}
                onChange={(v) => set({ client_email: v || null })}
              />
              <TextField
                label="WhatsApp number"
                value={d.client_phone}
                placeholder="2348012345678"
                hint="Country code first, no plus sign or spaces."
                onChange={(v) => set({ client_phone: v || null })}
              />
            </div>
          </Card>

          <Card title="Project">
            <div className="grid gap-4">
              <TextField
                label="Project title"
                value={d.project_title}
                onChange={(v) => set({ project_title: v })}
              />
              <TextAreaField
                label="Summary"
                rows={3}
                value={d.summary}
                placeholder="One or two sentences on what we're making and why."
                onChange={(v) => set({ summary: v || null })}
              />
            </div>
          </Card>

          <Card title="What's included">
            <div className="space-y-3">
              {d.items.map((it, i) => (
                <div
                  key={i}
                  className="grid gap-2 rounded-lg border border-mist p-3 sm:grid-cols-[1fr_80px_140px_auto]"
                >
                  <div className="space-y-2">
                    <input
                      value={it.description}
                      onChange={(e) => setItem(i, { description: e.target.value })}
                      placeholder="Item"
                      className="h-9 w-full rounded-md border border-mist px-3 text-sm font-medium"
                    />
                    <input
                      value={it.detail ?? ""}
                      onChange={(e) => setItem(i, { detail: e.target.value })}
                      placeholder="What it includes"
                      className="h-9 w-full rounded-md border border-mist px-3 text-sm"
                    />
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={it.qty}
                    onChange={(e) => setItem(i, { qty: Number(e.target.value) })}
                    aria-label="Quantity"
                    className="h-9 rounded-md border border-mist px-3 text-sm"
                  />
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={it.unit_price}
                    onChange={(e) => setItem(i, { unit_price: Number(e.target.value) })}
                    aria-label="Price in naira"
                    className="h-9 rounded-md border border-mist px-3 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => set({ items: d.items.filter((_, j) => j !== i) })}
                    aria-label="Remove line"
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    set({
                      items: [...d.items, { description: "", detail: "", qty: 1, unit_price: 0 }],
                    })
                  }
                >
                  <Plus /> Blank line
                </Button>
                {PACKAGES.map(({ label, ...item }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => set({ items: [...d.items, item] })}
                    className="rounded-full border border-mist bg-white px-3 py-1 text-xs text-ink hover:border-ink"
                  >
                    + {label} · {naira(item.unit_price)}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 border-t border-mist pt-4 sm:grid-cols-3">
                <TextField
                  label="Discount (₦)"
                  type="number"
                  value={d.discount}
                  onChange={(v) => set({ discount: Number(v) || 0 })}
                />
                <TextField
                  label="Deposit %"
                  type="number"
                  value={d.deposit_percent}
                  onChange={(v) =>
                    set({ deposit_percent: Math.min(100, Math.max(0, Number(v) || 0)) })
                  }
                />
                <div className="rounded-lg bg-muted/60 p-3 text-sm">
                  <p className="flex justify-between">
                    <span className="text-graphite">Total</span>
                    <b>{naira(t.total)}</b>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-graphite">Deposit</span>
                    <span>{naira(t.deposit)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-graphite">Balance</span>
                    <span>{naira(t.balance)}</span>
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Terms for this job">
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                label="Timeline"
                value={d.timeline}
                placeholder="7–10 days from deposit"
                onChange={(v) => set({ timeline: v || null })}
              />
              <TextField
                label="Rounds of changes"
                type="number"
                value={d.revisions}
                onChange={(v) => set({ revisions: Number(v) || 0 })}
              />
              <TextField
                label="Valid until"
                type="date"
                value={d.valid_until}
                onChange={(v) => set({ valid_until: v || null })}
              />
              <TextField
                label="Deposit payment link"
                className="sm:col-span-3"
                value={d.payment_link}
                placeholder="https://paystack.com/pay/radic-event-deposit"
                hint="Optional. A Paystack page for this deposit. Your bank details from Site settings show either way."
                onChange={(v) => set({ payment_link: v || null })}
              />
              <TextAreaField
                label="Notes for the client"
                className="sm:col-span-3"
                rows={3}
                value={d.notes}
                onChange={(v) => set({ notes: v || null })}
              />
              <TextAreaField
                label="Certificate: deliverables and third-party assets"
                className="sm:col-span-3"
                rows={3}
                value={d.deliverables_note}
                placeholder="Files delivered: logo (AI, SVG, PNG), brand guide (PDF). Fonts: Geist (SIL Open Font License)."
                hint="Printed on the certificate of ownership when the job is paid."
                onChange={(v) => set({ deliverables_note: v || null })}
              />
              <TextAreaField
                label="Private notes (studio only)"
                className="sm:col-span-3"
                rows={3}
                value={d.internal_notes}
                onChange={(v) => set({ internal_notes: v || null })}
              />
            </div>
          </Card>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-destructive"
              onClick={() => {
                if (confirm("Delete this quote? The client link stops working.")) remove.mutate();
              }}
            >
              <Trash2 /> Delete quote
            </Button>
            <Button
              type="button"
              onClick={() => save.mutate({}, { onSuccess: () => toast.success("Saved") })}
              disabled={save.isPending}
            >
              <Send /> Save
            </Button>
          </div>
        </fieldset>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-mist bg-white p-4 sm:p-5">
      <h2 className="mb-4 text-sm font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Audit({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={cn("min-w-0", wide && "sm:col-span-2")}>
      <dt className="text-xs text-graphite">{label}</dt>
      <dd className="truncate text-ink" title={value}>
        {value}
      </dd>
    </div>
  );
}

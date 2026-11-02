import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Copy, FilePlus2, Mail, MessageCircle, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/Shell";
import { draftReply } from "@/lib/ai";
import { Button } from "@/components/ui/button";
import { formatDate, whatsappLink } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import type { Inquiry } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/inquiries")({ component: Page });

const STATUS: Inquiry["status"][] = ["new", "read", "replied"];

function Page() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "inquiries"],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Inquiry[];
    },
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Inquiry["status"] }) => {
      const { error } = await getSupabase().from("inquiries").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabase().from("inquiries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Deleted");
    },
  });

  const list = q.data ?? [];

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Inquiries"
        text="Messages from the contact form. Reply by email or WhatsApp, then mark as replied."
      />
      {q.isLoading ? (
        <p className="text-sm text-graphite">Loading…</p>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-mist bg-white p-10 text-center text-sm text-graphite">
          No messages yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((m) => (
            <li
              key={m.id}
              className={cn(
                "rounded-xl border bg-white p-4",
                m.status === "new" ? "border-radic-red/60" : "border-mist",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">
                    {m.name}
                    {m.email && <span className="text-graphite"> · {m.email}</span>}
                    {m.source && m.source !== "contact" && (
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-graphite">
                        {m.source === "quote-whatsapp"
                          ? "Quote → WhatsApp"
                          : m.source === "quote-email"
                            ? "Quote → email"
                            : m.source}
                      </span>
                    )}
                  </p>
                  <p className="font-mono mt-0.5 text-xs text-graphite">
                    {formatDate(m.created_at)}
                    {m.budget_range ? ` · ${m.budget_range}` : ""}
                  </p>
                </div>
                <select
                  value={m.status}
                  onChange={(e) =>
                    setStatus.mutate({ id: m.id, status: e.target.value as Inquiry["status"] })
                  }
                  className={cn(
                    "h-8 rounded-md border px-2 text-xs font-medium",
                    m.status === "new"
                      ? "border-radic-red text-radic-red"
                      : "border-mist text-graphite",
                  )}
                >
                  {STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              {m.brief && Object.keys(m.brief).length > 0 && (
                <dl className="mt-3 grid gap-x-6 gap-y-1 rounded-lg bg-muted/60 p-3 text-xs sm:grid-cols-2">
                  {Object.entries(m.brief).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <dt className="shrink-0 text-graphite">{k}</dt>
                      <dd className="font-medium text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{m.message}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to Radic Studio")}`}
                    onClick={() =>
                      m.status === "new" && setStatus.mutate({ id: m.id, status: "read" })
                    }
                  >
                    <Mail /> Reply by email
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={whatsappLink(
                      "",
                      `Hi ${m.name}, thanks for your message to Radic Studio.`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle /> WhatsApp draft
                  </a>
                </Button>
                <DraftReplyButton inquiry={m} />
                <CreateQuoteButton inquiry={m} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-destructive"
                  onClick={() => remove.mutate(m.id)}
                >
                  <Trash2 /> Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DraftReplyButton({ inquiry }: { inquiry: Inquiry }) {
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            setDraft(await draftReply(inquiry));
          } catch (e) {
            toast.error((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Sparkles /> {busy ? "Drafting…" : "Draft reply with AI"}
      </Button>
      {draft && (
        <div className="mt-3 w-full rounded-lg border border-mist bg-paper p-3">
          <p className="text-xs font-medium text-graphite">Subject: {draft.subject}</p>
          <textarea
            className="mt-2 w-full rounded-md border border-mist bg-white p-2 text-sm"
            rows={7}
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" asChild>
              <a
                href={`mailto:${inquiry.email}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`}
              >
                <Mail /> Open in email
              </a>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(draft.body);
                toast.success("Copied");
              }}
            >
              <Copy /> Copy text
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

/** Starts a quote pre-filled from the message (and the quote-flow brief, when there is one). */
function CreateQuoteButton({ inquiry }: { inquiry: Inquiry }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const b = inquiry.brief ?? {};
        const what = b["Service"] || "";
        const kind = b["Project"] && b["Project"] !== "—" ? b["Project"] : "";
        const { data, error } = await getSupabase()
          .from("quotes")
          .insert({
            inquiry_id: inquiry.id,
            client_name: inquiry.name,
            client_email: inquiry.email || null,
            project_title: [what, kind].filter(Boolean).join(" — ") || "New project",
            summary: inquiry.message ? inquiry.message.slice(0, 400) : null,
            timeline: b["When"] || b["Timeline"] || null,
          })
          .select("id")
          .single();
        setBusy(false);
        if (error) {
          toast.error(error.message);
          return;
        }
        void navigate({ to: "/admin/quotes/$id", params: { id: data.id as string } });
      }}
    >
      <FilePlus2 /> {busy ? "Creating…" : "Create quote"}
    </Button>
  );
}

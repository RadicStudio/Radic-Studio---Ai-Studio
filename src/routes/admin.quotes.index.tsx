import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FilePlus2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/Shell";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { naira, quoteTotals, STATUS_LABEL, STATUS_TONE } from "@/lib/quotes";
import { getSupabase } from "@/lib/supabase";
import type { Quote } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/quotes/")({ component: Page });

function Page() {
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ["admin", "quotes"],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Quote[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await getSupabase()
        .from("quotes")
        .insert({ project_title: "New project" })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => navigate({ to: "/admin/quotes/$id", params: { id } }),
    onError: (e: Error) => toast.error(e.message),
  });

  const list = q.data ?? [];
  const open = list.filter((x) => ["sent", "viewed"].includes(x.status));
  const signed = list.filter((x) => x.status === "signed");
  const valueOpen = open.reduce((s, x) => s + quoteTotals(x).total, 0);
  const depositsDue = signed.reduce((s, x) => s + quoteTotals(x).deposit, 0);

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Quotes"
        text="Branded quotes clients can open, sign online and pay the deposit on."
        action={
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            <FilePlus2 /> {create.isPending ? "Creating…" : "New quote"}
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Waiting for a signature" value={`${open.length}`} note={naira(valueOpen)} />
        <Stat label="Signed, deposit due" value={`${signed.length}`} note={naira(depositsDue)} />
        <Stat
          label="Paid this month"
          value={`${
            list.filter(
              (x) =>
                x.status === "paid" &&
                x.paid_at &&
                new Date(x.paid_at).getMonth() === new Date().getMonth() &&
                new Date(x.paid_at).getFullYear() === new Date().getFullYear(),
            ).length
          }`}
          note="projects"
        />
      </div>

      {q.isLoading ? (
        <p className="text-sm text-graphite">Loading…</p>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-mist bg-white p-10 text-center text-sm text-graphite">
          No quotes yet. Create one here, or from a message in Inquiries.
        </div>
      ) : (
        <ul className="divide-y divide-mist overflow-hidden rounded-xl border border-mist bg-white">
          {list.map((x) => (
            <li key={x.id}>
              <Link
                to="/admin/quotes/$id"
                params={{ id: x.id }}
                className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 hover:bg-muted/50 sm:grid-cols-[110px_1fr_120px_110px]"
              >
                <span className="font-mono text-xs text-graphite">{x.number}</span>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">
                    {x.client_business || x.client_name || "No client yet"}
                  </span>
                  <span className="block truncate text-xs text-graphite">
                    {x.project_title} · {formatDate(x.created_at)}
                  </span>
                </span>
                <span className="hidden text-right text-sm font-medium tabular-nums sm:block">
                  {naira(quoteTotals(x).total)}
                </span>
                <span
                  className={cn(
                    "justify-self-end rounded-full px-2.5 py-1 text-[11px] font-medium",
                    STATUS_TONE[x.status],
                  )}
                >
                  {STATUS_LABEL[x.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-mist bg-white p-4">
      <p className="text-xs text-graphite">{label}</p>
      <p className="font-display mt-1 text-2xl font-semibold text-ink">{value}</p>
      <p className="text-xs text-graphite">{note}</p>
    </div>
  );
}

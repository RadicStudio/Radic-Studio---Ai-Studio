import { createFileRoute } from "@tanstack/react-router";

import { CrudList } from "@/components/admin/CrudList";
import { SelectField, TextAreaField, TextField } from "@/components/admin/Fields";
import { LucideIcon, SERVICE_ICONS } from "@/components/site/Bits";
import { formatPrice } from "@/lib/format";
import { SERVICE_KINDS, type Service } from "@/lib/types";

export const Route = createFileRoute("/admin/services")({ component: Page });

type Row = Service & Record<string, unknown>;

const KIND_LABEL: Record<string, string> = {
  uiux: "UI/UX: websites and apps",
  brand: "Brand identity",
  event: "Event campaign",
  social: "Social media retainer",
  print: "Print & packaging",
  illustration: "Illustration",
  motion: "Motion",
  other: "Other",
};

/** "" → null, "150,000" → 150000 */
function num(v: string): number | null {
  const n = Number(v.replace(/[^\d.]/g, ""));
  return v.trim() === "" || Number.isNaN(n) ? null : n;
}

function Page() {
  return (
    <CrudList<Row>
      table="services"
      title="Services"
      text="Shown on the home page, the Services page and as the first step of the quote flow. Leave “From” empty to show “Quoted per project”."
      itemName="service"
      visibleKey="is_visible"
      defaults={{
        title: "",
        description: "",
        icon: "Sparkles",
        sort_order: 0,
        is_visible: true,
        kind: "other",
        price_from: null,
        price_to: null,
        price_note: null,
        turnaround: null,
        concepts: 2,
        revisions: 2,
      }}
      leading={(r) => (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-radic-red-tint text-radic-red">
          <LucideIcon name={r.icon} className="h-4 w-4" />
        </div>
      )}
      render={(r) => (
        <>
          <p className="font-medium text-ink">{r.title}</p>
          <p className="line-clamp-1 text-xs text-graphite">
            {r.price_from != null
              ? `from ${formatPrice(Number(r.price_from), "₦")}${r.price_note ? ` ${r.price_note}` : ""}`
              : "Quoted per project"}
            {r.turnaround ? ` · ${r.turnaround}` : ""}
          </p>
        </>
      )}
      validate={(d) => {
        if (!d.title?.trim()) return "Title is required";
        if (d.price_from != null && d.price_to != null && Number(d.price_to) < Number(d.price_from))
          return "“Typical up to” should be higher than “From”";
        return null;
      }}
      form={(d, set) => (
        <>
          <TextField label="Title" value={d.title} onChange={(v) => set({ title: v })} />
          <TextAreaField
            label="Description"
            rows={3}
            value={d.description}
            onChange={(v) => set({ description: v })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="From (₦)"
              hint="The public starting price."
              value={d.price_from ?? ""}
              onChange={(v) => set({ price_from: num(v) })}
              placeholder="150000"
            />
            <TextField
              label="Typical up to (₦)"
              hint="Used for quote-flow estimates."
              value={d.price_to ?? ""}
              onChange={(v) => set({ price_to: num(v) })}
              placeholder="600000"
            />
            <TextField
              label="Price note"
              hint="e.g. per month, per event, per item"
              value={d.price_note}
              onChange={(v) => set({ price_note: v || null })}
            />
            <TextField
              label="Turnaround"
              hint="e.g. 3–7 days"
              value={d.turnaround}
              onChange={(v) => set({ turnaround: v || null })}
            />
            <TextField
              label="Concepts"
              type="number"
              value={d.concepts ?? ""}
              onChange={(v) => set({ concepts: v === "" ? null : Number(v) })}
            />
            <TextField
              label="Revision rounds"
              type="number"
              value={d.revisions ?? ""}
              onChange={(v) => set({ revisions: v === "" ? null : Number(v) })}
            />
          </div>
          <SelectField
            label="Quote-flow type"
            value={d.kind ?? "other"}
            onChange={(v) => set({ kind: v as Service["kind"] })}
            options={SERVICE_KINDS.map((k) => ({ value: k, label: KIND_LABEL[k] ?? k }))}
          />
          <SelectField
            label="Icon"
            value={d.icon ?? "Sparkles"}
            onChange={(v) => set({ icon: v })}
            options={Object.keys(SERVICE_ICONS).map((k) => ({ value: k, label: k }))}
          />
        </>
      )}
    />
  );
}

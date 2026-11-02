import { createFileRoute } from "@tanstack/react-router";

import { CrudList } from "@/components/admin/CrudList";
import { ListField, SwitchField, TextField } from "@/components/admin/Fields";
import { formatPrice } from "@/lib/format";
import type { PricingTier } from "@/lib/types";

export const Route = createFileRoute("/admin/pricing")({ component: Page });

type Row = PricingTier & Record<string, unknown>;

function Page() {
  return (
    <CrudList<Row>
      table="pricing_tiers"
      title="Pricing"
      text="Packages on the Services page. To hide pricing entirely, use the switch in Site settings."
      itemName="package"
      visibleKey="is_visible"
      defaults={{
        name: "",
        price: null,
        currency: "₦",
        period: "per project",
        features: [],
        is_highlighted: false,
        is_visible: true,
        sort_order: 0,
      }}
      render={(r) => (
        <>
          <p className="font-medium text-ink">
            {r.name}{" "}
            {r.is_highlighted && (
              <span className="ml-1 rounded-full bg-radic-red px-2 py-0.5 text-[10px] font-semibold text-white">
                POPULAR
              </span>
            )}
          </p>
          <p className="text-xs text-graphite">
            {formatPrice(r.price, r.currency)} {r.period} · {r.features.length} items
          </p>
        </>
      )}
      validate={(d) => (!d.name?.trim() ? "Name is required" : null)}
      form={(d, set) => (
        <>
          <TextField label="Package name" value={d.name} onChange={(v) => set({ name: v })} />
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              label="Currency symbol"
              value={d.currency}
              onChange={(v) => set({ currency: v })}
            />
            <TextField
              label="Price"
              type="number"
              value={d.price}
              onChange={(v) => set({ price: v === "" ? null : Number(v) })}
              hint="Leave empty for “Custom”"
            />
            <TextField
              label="Period"
              value={d.period}
              onChange={(v) => set({ period: v })}
              placeholder="per project"
            />
          </div>
          <ListField
            label="What's included"
            value={d.features ?? []}
            onChange={(v) => set({ features: v })}
            rows={6}
          />
          <SwitchField
            label="Most popular"
            checked={!!d.is_highlighted}
            onChange={(v) => set({ is_highlighted: v })}
            hint="Highlights this package"
          />
        </>
      )}
    />
  );
}

import { createFileRoute } from "@tanstack/react-router";

import { CrudList } from "@/components/admin/CrudList";
import { ImageField, TextField } from "@/components/admin/Fields";
import type { ClientLogo } from "@/lib/types";

export const Route = createFileRoute("/admin/clients")({ component: Page });

type Row = ClientLogo & Record<string, unknown>;

function Page() {
  return (
    <CrudList<Row>
      table="client_logos"
      title="Client logos"
      text="Scroll in the “Trusted by” strip on the home page. Without a logo, the name is shown as text."
      itemName="client"
      visibleKey="is_visible"
      defaults={{ name: "", logo_url: null, sort_order: 0, is_visible: true }}
      leading={(r) => (
        <div className="flex h-10 w-16 items-center justify-center rounded-md bg-muted">
          {r.logo_url ? (
            <img src={r.logo_url} alt="" className="max-h-8 max-w-[56px] object-contain" />
          ) : (
            <span className="text-xs text-graphite">Aa</span>
          )}
        </div>
      )}
      render={(r) => <p className="font-medium text-ink">{r.name}</p>}
      validate={(d) => (!d.name?.trim() ? "Name is required" : null)}
      form={(d, set) => (
        <>
          <TextField label="Client name" value={d.name} onChange={(v) => set({ name: v })} />
          <ImageField
            label="Logo"
            value={d.logo_url}
            onChange={(url) => set({ logo_url: url })}
            folder="clients"
            aspect="aspect-[3/1]"
            hint="PNG or SVG with a transparent background looks best."
          />
        </>
      )}
    />
  );
}

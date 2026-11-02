import { createFileRoute } from "@tanstack/react-router";

import { CrudList } from "@/components/admin/CrudList";
import { TextField } from "@/components/admin/Fields";
import { slugify } from "@/lib/format";
import type { Category } from "@/lib/types";

export const Route = createFileRoute("/admin/categories")({ component: Page });

type Row = Category & Record<string, unknown>;

function Page() {
  return (
    <CrudList<Row>
      table="categories"
      title="Categories"
      text="Used to filter the Work page. Keep the list short."
      itemName="category"
      defaults={{ name: "", slug: "", sort_order: 0 }}
      render={(r) => (
        <>
          <p className="font-medium text-ink">{r.name}</p>
          <p className="font-mono text-xs text-graphite">{r.slug}</p>
        </>
      )}
      validate={(d) => (!d.name?.trim() ? "Name is required" : null)}
      form={(d, set) => (
        <>
          <TextField
            label="Name"
            value={d.name}
            onChange={(v) => set({ name: v, slug: slugify(v) })}
          />
          <TextField label="Slug" value={d.slug} onChange={(v) => set({ slug: slugify(v) })} />
        </>
      )}
    />
  );
}

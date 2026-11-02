import { createFileRoute } from "@tanstack/react-router";

import { CrudList } from "@/components/admin/CrudList";
import { ImageField, TextAreaField, TextField } from "@/components/admin/Fields";
import type { Testimonial } from "@/lib/types";

export const Route = createFileRoute("/admin/testimonials")({ component: Page });

type Row = Testimonial & Record<string, unknown>;

function Page() {
  return (
    <CrudList<Row>
      table="testimonials"
      title="Testimonials"
      text="The first three visible ones appear on the home page."
      itemName="testimonial"
      visibleKey="is_visible"
      defaults={{
        quote: "",
        author_name: "",
        author_role: "",
        company: "",
        avatar_url: null,
        sort_order: 0,
        is_visible: true,
      }}
      render={(r) => (
        <>
          <p className="line-clamp-1 text-ink">“{r.quote}”</p>
          <p className="text-xs text-graphite">
            {r.author_name}
            {r.company ? `, ${r.company}` : ""}
          </p>
        </>
      )}
      validate={(d) =>
        !d.quote?.trim() || !d.author_name?.trim() ? "Quote and name are required" : null
      }
      form={(d, set) => (
        <>
          <TextAreaField
            label="Quote"
            rows={3}
            value={d.quote}
            onChange={(v) => set({ quote: v })}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              label="Name"
              value={d.author_name}
              onChange={(v) => set({ author_name: v })}
            />
            <TextField
              label="Role"
              value={d.author_role}
              onChange={(v) => set({ author_role: v })}
            />
            <TextField label="Company" value={d.company} onChange={(v) => set({ company: v })} />
          </div>
          <ImageField
            label="Photo (optional)"
            value={d.avatar_url}
            onChange={(url) => set({ avatar_url: url })}
            folder="people"
            aspect="aspect-square max-w-[160px]"
          />
        </>
      )}
    />
  );
}

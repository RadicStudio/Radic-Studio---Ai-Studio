import { createFileRoute } from "@tanstack/react-router";

import { CrudList } from "@/components/admin/CrudList";
import { SelectField, TextField } from "@/components/admin/Fields";
import { PLATFORM_LABEL, SocialIcon } from "@/components/site/SocialIcon";
import { SOCIAL_PLATFORMS, type SocialLink } from "@/lib/types";

export const Route = createFileRoute("/admin/socials")({ component: Page });

type Row = SocialLink & Record<string, unknown>;

function Page() {
  return (
    <CrudList<Row>
      table="social_links"
      title="Social links"
      text="Shown in the header menu, footer and contact page. Switch a link on once its URL is filled in."
      itemName="link"
      visibleKey="is_visible"
      defaults={{ platform: "instagram", label: "", url: "", sort_order: 0, is_visible: false }}
      leading={(r) => <SocialIcon link={r} />}
      render={(r) => (
        <>
          <p className="font-medium text-ink">{r.label || PLATFORM_LABEL[r.platform]}</p>
          <p className="truncate text-xs text-graphite">{r.url || "No URL yet"}</p>
        </>
      )}
      validate={(d) =>
        d.is_visible && !d.url?.trim() ? "Add a URL before making it visible" : null
      }
      form={(d, set) => (
        <>
          <SelectField
            label="Platform"
            value={d.platform ?? "other"}
            onChange={(v) => set({ platform: v as SocialLink["platform"] })}
            options={SOCIAL_PLATFORMS.map((p) => ({ value: p, label: PLATFORM_LABEL[p] }))}
          />
          <TextField
            label="URL"
            value={d.url}
            onChange={(v) => set({ url: v })}
            placeholder="https://instagram.com/radic.studio"
          />
          <TextField
            label="Label (optional)"
            value={d.label}
            onChange={(v) => set({ label: v })}
            hint="Defaults to the platform name"
          />
        </>
      )}
    />
  );
}

import { createFileRoute } from "@tanstack/react-router";

import { CrudList } from "@/components/admin/CrudList";
import { hasBuiltInGlyph, ToolIcon } from "@/components/site/ToolIcon";
import { ImageField, TextField } from "@/components/admin/Fields";
import type { Tool } from "@/lib/types";

export const Route = createFileRoute("/admin/tools")({ component: Page });

type Row = Tool & Record<string, unknown>;

function Page() {
  return (
    <CrudList<Row>
      table="tools"
      title="Tools"
      text="The software shown under “Tools” on project pages. CorelDRAW, Figma, Sketch and Blender show their official icon automatically. Adobe doesn’t allow its logos in public icon libraries, so for Photoshop, Illustrator and InDesign download the official app icon from Adobe’s brand pages and upload it here (PNG or SVG, transparent background)."
      itemName="tool"
      visibleKey="is_visible"
      defaults={{ name: "", icon_url: null, sort_order: 0, is_visible: true }}
      leading={(r) => <ToolIcon name={r.name} tool={r} size={40} />}
      render={(r) => (
        <>
          <p className="font-medium text-ink">{r.name}</p>
          <p className="text-xs text-graphite">
            {r.icon_url
              ? "Icon uploaded"
              : hasBuiltInGlyph(r.name)
                ? "Official icon shown automatically"
                : "No icon yet: initials are shown"}
          </p>
        </>
      )}
      validate={(d) => (!d.name?.trim() ? "Name is required" : null)}
      form={(d, set) => (
        <>
          <TextField
            label="Tool name"
            value={d.name}
            onChange={(v) => set({ name: v })}
            hint="Must match the name used on projects, e.g. Photoshop, CorelDRAW, Illustrator, InDesign"
          />
          <ImageField
            label="Icon"
            value={d.icon_url}
            onChange={(url) => set({ icon_url: url })}
            folder="tools"
            aspect="aspect-square max-w-[140px]"
            hint="Square works best. Official app icons can be downloaded from each vendor's brand page."
          />
        </>
      )}
    />
  );
}

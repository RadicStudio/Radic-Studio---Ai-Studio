import { SiBlender, SiCoreldraw, SiFigma, SiSketch } from "@icons-pack/react-simple-icons";
import type { ComponentType } from "react";

import type { Tool } from "@/lib/types";
import { cn } from "@/lib/utils";

type Glyph = ComponentType<{ className?: string; color?: string }>;

/**
 * Official glyphs available in the Simple Icons set. Adobe asked Simple Icons to remove its
 * logos, so Photoshop, Illustrator and InDesign need their official icon uploaded in /admin → Tools.
 */
const BUILT_IN: Record<string, { Icon: Glyph; color: string }> = {
  coreldraw: { Icon: SiCoreldraw, color: "#000000" },
  figma: { Icon: SiFigma, color: "default" },
  sketch: { Icon: SiSketch, color: "default" },
  blender: { Icon: SiBlender, color: "default" },
};

export function hasBuiltInGlyph(name: string) {
  return name.toLowerCase().replace(/\s+/g, "") in BUILT_IN;
}

/** Behance-style "tools used" tile: the app icon when we have one, else a tidy initials tile. */
export function ToolIcon({
  name,
  tool,
  size = 40,
  className,
}: {
  name: string;
  tool?: Tool | undefined;
  size?: number;
  className?: string;
}) {
  const key = name.toLowerCase().replace(/\s+/g, "");
  const builtIn = BUILT_IN[key];
  const box = { width: size, height: size };

  if (tool?.icon_url) {
    return (
      <img
        src={tool.icon_url}
        alt=""
        style={box}
        className={cn("shrink-0 rounded-[22%] object-contain", className)}
        loading="lazy"
      />
    );
  }
  if (builtIn) {
    const { Icon, color } = builtIn;
    return (
      <span
        style={box}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-[22%] bg-surface",
          className,
        )}
      >
        <Icon className="h-[56%] w-[56%]" color={color} />
      </span>
    );
  }
  const words = name
    .replace(/[^A-Za-z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  const initials =
    words.length > 1
      ? (words[0]![0]! + words[1]![0]!).toUpperCase()
      : (words[0] ?? "?").slice(0, 2).replace(/^./, (c) => c.toUpperCase());
  return (
    <span
      style={{ ...box, fontSize: size * 0.34 }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[22%] bg-ink font-semibold text-paper",
        className,
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

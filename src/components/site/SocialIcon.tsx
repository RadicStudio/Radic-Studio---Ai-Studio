import {
  SiBehance,
  SiDribbble,
  SiFacebook,
  SiInstagram,
  SiPinterest,
  SiThreads,
  SiTiktok,
  SiWhatsapp,
  SiX,
  SiYoutube,
} from "@icons-pack/react-simple-icons";
import { ArrowUpRight, Linkedin } from "lucide-react";
import type { ComponentType } from "react";

import type { SocialLink, SocialPlatform } from "@/lib/types";
import { cn } from "@/lib/utils";

type IconComponent = ComponentType<{ className?: string; size?: number | string }>;

/** Official glyphs from the Simple Icons set; LinkedIn is not in that set, so Lucide fills in. */
const ICONS: Record<SocialPlatform, IconComponent> = {
  x: SiX,
  facebook: SiFacebook,
  instagram: SiInstagram,
  linkedin: Linkedin,
  behance: SiBehance,
  dribbble: SiDribbble,
  tiktok: SiTiktok,
  youtube: SiYoutube,
  threads: SiThreads,
  pinterest: SiPinterest,
  other: ArrowUpRight,
};

export const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  x: "X",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  behance: "Behance",
  dribbble: "Dribbble",
  tiktok: "TikTok",
  youtube: "YouTube",
  threads: "Threads",
  pinterest: "Pinterest",
  other: "Link",
};

export { SiWhatsapp as WhatsAppGlyph };

export function PlatformGlyph({
  platform,
  className,
}: {
  platform: SocialPlatform;
  className?: string;
}) {
  const Icon = ICONS[platform] ?? ArrowUpRight;
  return <Icon className={className} aria-hidden="true" />;
}

/**
 * Round social button. `tone="bare"` is the navbar version: just the glyph, no disc,
 * the way Mobbin sets its YouTube and X links.
 */
export function SocialIcon({
  link,
  tone = "dark",
  className,
}: {
  link: SocialLink;
  tone?: "dark" | "light" | "bare";
  className?: string;
}) {
  const label = link.label || PLATFORM_LABEL[link.platform] || "Link";
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center transition-colors duration-300",
        tone === "dark" &&
          "h-10 w-10 rounded-full bg-surface text-ink hover:bg-ink hover:text-paper",
        tone === "light" &&
          "h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white hover:text-ink",
        tone === "bare" && "h-9 w-9 rounded-full text-ink hover:bg-surface",
        className,
      )}
    >
      <PlatformGlyph platform={link.platform} className="h-[18px] w-[18px]" />
    </a>
  );
}

export function SocialRow({
  links,
  tone = "dark",
  className,
}: {
  links: SocialLink[];
  tone?: "dark" | "light" | "bare";
  className?: string;
}) {
  if (!links.length) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {links.map((l) => (
        <SocialIcon key={l.id} link={l} tone={tone} />
      ))}
    </div>
  );
}

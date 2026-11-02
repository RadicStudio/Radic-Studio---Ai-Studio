import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Box,
  Brush,
  Camera,
  Clapperboard,
  Film,
  Globe,
  Layers,
  LayoutGrid,
  Megaphone,
  MessageCircle,
  Monitor,
  Package,
  Palette,
  PenTool,
  Printer,
  Shapes,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Type,
  type LucideIcon as LucideIconType,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Magnetic, Reveal, SplitReveal } from "./motion";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  h1,
  title,
  text,
  align = "left",
  className,
}: {
  eyebrow?: string;
  /** The page's main heading for search engines, shown as a small line above the display title. */
  h1?: string;
  title: ReactNode;
  text?: ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {h1 ? (
        <h1 className="mb-3 text-sm font-medium text-graphite">{h1}</h1>
      ) : (
        eyebrow && <p className="mb-3 text-sm text-graphite">{eyebrow}</p>
      )}
      {typeof title === "string" ? (
        <SplitReveal
          as="h2"
          text={title}
          className="display-wide text-[34px] text-ink sm:text-4xl md:text-5xl"
        />
      ) : (
        <h2 className="display-wide text-[34px] text-ink sm:text-4xl md:text-5xl">{title}</h2>
      )}
      {text && (
        <Reveal as="div" delay={0.2}>
          <p className="mt-4 text-[17px] leading-relaxed text-graphite md:text-xl md:leading-snug">
            {text}
          </p>
        </Reveal>
      )}
    </div>
  );
}

type BtnProps = {
  children: ReactNode;
  variant?: "primary" | "ghost" | "light";
  className?: string;
};

function btnClass(variant: BtnProps["variant"]) {
  return cn(
    "group/btn font-display inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-semibold transition-[background-color,transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]",
    variant === "primary" &&
      "bg-ink text-paper hover:bg-ink/85 hover:shadow-[0_10px_24px_-12px_rgba(0,0,0,0.5)]",
    variant === "ghost" && "bg-surface text-ink hover:bg-mist",
    variant === "light" && "bg-paper text-ink hover:bg-mist",
  );
}

export function ButtonLink({
  to,
  children,
  variant = "primary",
  className,
}: BtnProps & { to: string }) {
  return (
    <Magnetic>
      <Link to={to} className={cn(btnClass(variant), className)}>
        {children}
        <ArrowUpRight
          className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
          aria-hidden="true"
        />
      </Link>
    </Magnetic>
  );
}

export function ButtonA({
  href,
  children,
  variant = "primary",
  className,
  external = true,
}: BtnProps & { href: string; external?: boolean }) {
  return (
    <Magnetic>
      <a
        href={href}
        className={cn(btnClass(variant), className)}
        {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      >
        {children}
        <ArrowUpRight
          className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
          aria-hidden="true"
        />
      </a>
    </Magnetic>
  );
}

/** Icons the admin can pick for services, by name. Add more here if needed. */
export const SERVICE_ICONS: Record<string, LucideIconType> = {
  PenTool,
  Brush,
  Palette,
  LayoutGrid,
  Monitor,
  Smartphone,
  Package,
  Printer,
  Clapperboard,
  Film,
  Camera,
  Type,
  Shapes,
  Layers,
  Box,
  Globe,
  Megaphone,
  ShoppingBag,
  Sparkles,
};

export function LucideIcon({
  name,
  className,
}: {
  name: string | null | undefined;
  className?: string;
}) {
  const Icon = (name && SERVICE_ICONS[name]) || Sparkles;
  return <Icon className={className} aria-hidden="true" />;
}

export function Marquee({
  children,
  className,
  speed = 40,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
}) {
  return (
    <div
      className={cn("paused overflow-hidden", className)}
      style={{ maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)" }}
    >
      <div
        className="flex w-max animate-marquee gap-12 pr-12"
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}

export function WhatsAppFab({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-40 hidden h-14 w-14 animate-pulse-once md:flex items-center justify-center rounded-full bg-ink text-paper shadow-lg transition-transform hover:scale-105 md:bottom-7 md:right-7"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}

/**
 * Mobile-only bar that appears after the first scroll: one low-commitment action plus WhatsApp.
 * Hidden on the pages that already are the action.
 */
export function StickyQuoteBar({ whatsapp, pathname }: { whatsapp: string; pathname: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (pathname.startsWith("/quote") || pathname.startsWith("/contact")) return null;
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/90 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden",
        show ? "translate-y-0" : "translate-y-full",
      )}
      aria-hidden={!show}
    >
      <div className="flex items-center gap-2">
        <Link
          to="/quote"
          tabIndex={show ? 0 : -1}
          className="font-display flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3.5 text-[15px] font-semibold text-paper active:scale-[0.98]"
        >
          Get a price range
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <a
          href={whatsapp}
          target="_blank"
          rel="noreferrer noopener"
          tabIndex={show ? 0 : -1}
          aria-label="Chat on WhatsApp"
          className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-surface text-ink active:scale-[0.96]"
        >
          <MessageCircle className="h-5 w-5" />
        </a>
      </div>
    </div>
  );
}

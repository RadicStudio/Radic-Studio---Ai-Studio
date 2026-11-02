import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { LucideIcon } from "./Bits";
import { formatPrice } from "@/lib/format";
import type { Service } from "@/lib/types";
import { cn } from "@/lib/utils";

/** "2–6 weeks · 2 concepts · 2 revisions" */
export function serviceSpec(s: Service): string[] {
  const out: string[] = [];
  if (s.turnaround) out.push(s.turnaround);
  if (s.concepts) out.push(`${s.concepts} concept${s.concepts === 1 ? "" : "s"}`);
  if (s.revisions) out.push(`${s.revisions} revision${s.revisions === 1 ? "" : "s"}`);
  return out;
}

export function servicePrice(s: Service): { lead: string; amount: string; note: string } {
  if (s.price_from == null) return { lead: "", amount: "Quoted per project", note: "" };
  return { lead: "from", amount: formatPrice(Number(s.price_from), "₦"), note: s.price_note ?? "" };
}

/**
 * A service with its price, turnaround, concepts and revisions up front
 * (the Behance Services pattern). The whole card opens the quote flow on that service.
 */
export function ServiceCard({
  service: s,
  size = "md",
  className,
}: {
  service: Service;
  size?: "sm" | "md";
  className?: string;
}) {
  const price = servicePrice(s);
  const spec = serviceSpec(s);
  return (
    <Link
      to="/quote"
      search={{ service: s.id }}
      className={cn(
        "panel group flex h-full flex-col p-6 transition-[background-color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-mist md:p-7",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-paper text-ink transition-colors duration-300 group-hover:bg-ink group-hover:text-paper">
          <LucideIcon name={s.icon} className="h-5 w-5" />
        </div>
        <ArrowUpRight
          className="h-5 w-5 text-graphite opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
          aria-hidden="true"
        />
      </div>
      <h3
        className={cn(
          "font-display mt-5 font-semibold text-ink",
          size === "sm" ? "text-lg" : "text-xl",
        )}
      >
        {s.title}
      </h3>
      {s.description && (
        <p
          className={cn(
            "mt-1.5 leading-relaxed text-graphite",
            size === "sm" ? "text-sm" : "text-[15px]",
          )}
        >
          {s.description}
        </p>
      )}
      <div className="mt-auto pt-6">
        <p className="text-ink">
          {price.lead && <span className="text-sm text-graphite">{price.lead} </span>}
          <span className={cn("font-semibold", size === "sm" ? "text-base" : "text-lg")}>
            {price.amount}
          </span>
          {price.note && <span className="text-sm text-graphite"> {price.note}</span>}
        </p>
        {spec.length > 0 && <p className="mt-1 text-xs text-graphite">{spec.join(" · ")}</p>}
      </div>
    </Link>
  );
}

/** The closing tile in a service grid: for visitors who don't know which service they need. */
export function QuoteTile({ className }: { className?: string }) {
  return (
    <Link
      to="/quote"
      className={cn(
        "group flex h-full flex-col justify-between rounded-3xl bg-ink p-6 text-paper transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 md:p-7",
        className,
      )}
    >
      <p className="text-sm text-paper/60">Not sure which one?</p>
      <div>
        <p className="font-display text-xl font-semibold leading-snug">
          Get a price range in six taps.
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium">
          Start
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </p>
      </div>
    </Link>
  );
}

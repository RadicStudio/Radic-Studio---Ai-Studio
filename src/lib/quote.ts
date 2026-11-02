import { formatPrice } from "./format";
import type { Service, ServiceKind } from "./types";

/**
 * Quote-flow logic. Prices come from each service's "From" and "Typical up to" in /admin;
 * the options below only scale them. A multiplier pair [lo, hi] is applied to the service's
 * "From" price (so a "Logo + launch kit" at [1, 1.7] on a ₦150k service reads ₦150k–₦255k).
 */

export type Option = { id: string; label: string; hint?: string; range?: [number, number] };
export type Branch = { question: string; options: Option[] };

const GENERIC: Branch = {
  question: "How big is the job?",
  options: [
    { id: "small", label: "Small", hint: "One piece or a quick job", range: [1, 1.5] },
    { id: "medium", label: "Medium", hint: "A small set that belongs together", range: [1.5, 2.5] },
    { id: "large", label: "Large", hint: "A full system or campaign", range: [2.5, 4] },
  ],
};

export const BRANCHES: Record<ServiceKind, Branch> = {
  uiux: {
    question: "What are we designing?",
    options: [
      {
        id: "landing",
        label: "A landing page",
        hint: "One page that sells one thing",
        range: [1, 1.5],
      },
      { id: "site", label: "A multi-page website", hint: "5–8 pages", range: [1.5, 3] },
      {
        id: "app",
        label: "App screens for an MVP",
        hint: "Key flows: sign-up, home, checkout",
        range: [2, 4],
      },
      {
        id: "redesign",
        label: "Redesign an existing product",
        hint: "Website or app",
        range: [1.5, 3],
      },
    ],
  },
  brand: {
    question: "Where is the brand today?",
    options: [
      {
        id: "kit",
        label: "Logo + launch kit",
        hint: "Logo, colours, card and social profile set",
        range: [1, 1.7],
      },
      {
        id: "full",
        label: "Full brand identity",
        hint: "Logo, guidelines, stationery, social templates",
        range: [2.3, 4],
      },
      { id: "rebrand", label: "Rebrand an existing business", range: [2.3, 4.5] },
      {
        id: "rest",
        label: "I have a logo, I need the rest",
        hint: "Colours, type, templates",
        range: [1, 2],
      },
    ],
  },
  event: {
    question: "What kind of event?",
    options: [
      { id: "club", label: "Club night or party", range: [1, 1.75] },
      { id: "concert", label: "Concert or festival", range: [1.5, 3] },
      { id: "wedding", label: "Wedding or social event", range: [1, 1.8] },
      { id: "corporate", label: "Corporate event or launch", range: [1.5, 3] },
    ],
  },
  social: {
    question: "How many posts a month?",
    options: [
      { id: "8", label: "About 8 posts", range: [1, 1.2] },
      { id: "12", label: "About 12 posts", range: [1.3, 1.6] },
      { id: "20", label: "About 20 posts + stories", range: [1.8, 2.3] },
      { id: "30", label: "30 posts + stories + short videos", range: [2.5, 3] },
    ],
  },
  print: {
    question: "What needs printing?",
    options: [
      { id: "flyers", label: "Flyers or posters", range: [0.5, 1] },
      {
        id: "packaging",
        label: "Packaging for a product",
        hint: "Per product, print-ready with dieline",
        range: [1, 2.5],
      },
      { id: "signage", label: "Banners and signage", range: [0.6, 1.5] },
      {
        id: "stationery",
        label: "Stationery set",
        hint: "Cards, letterhead, envelopes",
        range: [0.6, 1.2],
      },
    ],
  },
  illustration: GENERIC,
  motion: GENERIC,
  other: GENERIC,
};

export const ASSETS: Option[] = [
  { id: "nothing", label: "Nothing yet", hint: "We start from scratch" },
  { id: "logo", label: "A logo" },
  { id: "brand", label: "Logo and brand guidelines" },
  { id: "content", label: "Text and photos are ready" },
  { id: "all", label: "All of the above" },
];

export const TIMELINES: Option[] = [
  { id: "rush", label: "This week", hint: "Rush: 25–50% extra" },
  { id: "2-3w", label: "In 2–3 weeks" },
  { id: "month", label: "Next month" },
  { id: "flex", label: "I'm flexible" },
];

export const BUDGETS: (Option & { min: number; max: number })[] = [
  { id: "lt100", label: "Under ₦100k", min: 0, max: 100_000 },
  { id: "100-250", label: "₦100k – ₦250k", min: 100_000, max: 250_000 },
  { id: "250-500", label: "₦250k – ₦500k", min: 250_000, max: 500_000 },
  { id: "500-1m", label: "₦500k – ₦1m", min: 500_000, max: 1_000_000 },
  { id: "1m", label: "₦1m and above", min: 1_000_000, max: Number.POSITIVE_INFINITY },
  { id: "unsure", label: "Not sure yet", hint: "Show me typical prices", min: 0, max: 0 },
];

/** Style tiles use the studio's own work, so the visitor points at real pieces. */
export const STYLES: { id: string; label: string; image: string }[] = [
  { id: "bold", label: "Bold and loud", image: "/work/amapiano-rave/cover.webp" },
  {
    id: "clean",
    label: "Clean and corporate",
    image: "/work/firmig-global-legacy-brand/cover.webp",
  },
  {
    id: "premium",
    label: "Premium and minimal",
    image: "/work/bennys-couture-identity/cover.webp",
  },
  { id: "playful", label: "Bright and playful", image: "/work/bluebird-app-campaign/cover.webp" },
  { id: "local", label: "Rooted and traditional", image: "/work/calabash-illustration/cover.webp" },
  {
    id: "illustrated",
    label: "Illustrated and patterned",
    image: "/work/dj-ciko-brand-identity/cover.webp",
  },
];

export type Answers = {
  serviceId?: string;
  branch?: string;
  assets?: string;
  timeline?: string;
  budget?: string;
  style?: string;
};

function round(n: number) {
  const step = n < 100_000 ? 5_000 : n < 1_000_000 ? 10_000 : 50_000;
  return Math.round(n / step) * step;
}

export type Estimate =
  { kind: "range"; lo: number; hi: number; text: string } | { kind: "personal"; text: string };

export function estimate(service: Service | undefined, a: Answers): Estimate {
  if (!service || service.price_from == null) {
    return { kind: "personal", text: "We price this one personally" };
  }
  const from = Number(service.price_from);
  const branch = BRANCHES[service.kind] ?? GENERIC;
  const opt = branch.options.find((o) => o.id === a.branch);
  let [mlo, mhi] = opt?.range ?? [1, service.price_to ? Number(service.price_to) / from : 2];
  if (a.assets === "nothing") mhi *= 1.15;
  if (a.timeline === "rush") {
    mlo *= 1.25;
    mhi *= 1.5;
  }
  let lo = round(from * mlo);
  let hi = round(from * mhi);
  // Never quote above the admin's "typical up to" by more than the rush premium allows.
  if (service.price_to && a.timeline !== "rush")
    hi = Math.min(hi, round(Number(service.price_to) * 1.15));
  if (hi <= lo) hi = round(lo * 1.3);
  lo = Math.max(lo, round(from));
  return {
    kind: "range",
    lo,
    hi,
    text: `${formatPrice(lo, "₦")} – ${formatPrice(hi, "₦")}${service.price_note ? ` ${service.price_note}` : ""}`,
  };
}

/** A gentle note when the chosen budget band sits outside the estimate. */
export function budgetNote(est: Estimate, budgetId: string | undefined): string | null {
  if (est.kind !== "range" || !budgetId) return null;
  const b = BUDGETS.find((x) => x.id === budgetId);
  if (!b || b.id === "unsure") return null;
  if (b.max < est.lo)
    return "That’s below the usual range. We’ll suggest a lighter version that fits your budget.";
  if (b.min > est.hi) return "Your budget leaves room for more. We’ll suggest what’s worth adding.";
  return null;
}

export function labelOf(list: Option[], id: string | undefined) {
  return list.find((o) => o.id === id)?.label;
}

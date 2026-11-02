import { SITE_URL } from "@/lib/supabase";
import type { PublicQuote, QuoteItem, QuoteStatus } from "@/lib/types";

export function quoteTotals(q: Pick<PublicQuote, "items" | "discount" | "deposit_percent">) {
  const subtotal = (q.items ?? []).reduce(
    (sum, it) => sum + (Number(it.qty) || 0) * (Number(it.unit_price) || 0),
    0,
  );
  const discount = Math.min(Math.max(Number(q.discount) || 0, 0), subtotal);
  const total = subtotal - discount;
  const deposit = Math.round((total * (Number(q.deposit_percent) || 0)) / 100);
  return { subtotal, discount, total, deposit, balance: total - deposit };
}

export function naira(n: number): string {
  return `₦${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(Math.round(n))}`;
}

export function quoteUrl(token: string): string {
  return `${SITE_URL}/q/${token}`;
}

export function longDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function dateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
    timeZoneName: "short",
  });
}

export const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  signed: "Signed",
  paid: "Paid",
  declined: "Declined",
  expired: "Expired",
};

export const STATUS_TONE: Record<QuoteStatus, string> = {
  draft: "bg-muted text-graphite",
  sent: "bg-sky-50 text-sky-800",
  viewed: "bg-amber-50 text-amber-800",
  signed: "bg-emerald-50 text-emerald-800",
  paid: "bg-ink text-paper",
  declined: "bg-red-50 text-red-700",
  expired: "bg-muted text-graphite",
};

/** Ready-made lines for the quote editor, matching the packages in the playbook. */
export const PACKAGES: (QuoteItem & { label: string })[] = [
  {
    label: "Event Bundle",
    description: "Event Bundle",
    detail: "Main flyer, line-up, 1 ticket design, WhatsApp Status cut, 2 rounds of changes",
    qty: 1,
    unit_price: 80000,
  },
  {
    label: "Event Bundle Plus",
    description: "Event Bundle Plus",
    detail: "Event Bundle + confirmatories for each act, backdrop or roll-up, short motion flyer",
    qty: 1,
    unit_price: 150000,
  },
  {
    label: "Logo Kit",
    description: "Logo Kit",
    detail: "2 logo directions, 2 rounds, colours, business card, social profile set",
    qty: 1,
    unit_price: 150000,
  },
  {
    label: "Brand Identity",
    description: "Brand Identity",
    detail: "Logo system, colours, type, brand guide, stationery, 10 social templates",
    qty: 1,
    unit_price: 350000,
  },
  {
    label: "Packaging (per item)",
    description: "Packaging design",
    detail: "Print-ready label, bag or box with dieline",
    qty: 1,
    unit_price: 80000,
  },
  {
    label: "Social Retainer (month)",
    description: "Social Retainer",
    detail: "12 posts, 1 campaign set, 48-hour priority, per month",
    qty: 1,
    unit_price: 120000,
  },
  {
    label: "UI/UX design",
    description: "UI/UX design",
    detail: "Screens and clickable Figma prototype, developer handover",
    qty: 1,
    unit_price: 400000,
  },
  {
    label: "Extra round of changes",
    description: "Extra round of changes",
    detail: "One combined list of changes after the 2 included",
    qty: 1,
    unit_price: 15000,
  },
];

export const TERMS_SUMMARY = [
  "50% deposit to start, 50% before final files. Jobs under ₦100,000 are paid in full up front.",
  "2 rounds of changes are included; more are charged at the rate in this quote.",
  "The timeline starts when the deposit is paid and we have your content.",
  "After full payment, Radic Studio transfers the copyright in the final approved design to you, in writing.",
  "Radic Studio keeps drafts and unused concepts, and may show the finished work in its portfolio once it is public.",
];

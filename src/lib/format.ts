import { Marked } from "marked";

export function formatPrice(price: number | null, currency = "₦"): string {
  if (price === null || price === undefined) return "Custom";
  return `${currency}${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(price)}`;
}

export function whatsappLink(number: string | null | undefined, text?: string): string {
  const digits = (number ?? "").replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const SAFE_URL = /^(https?:|mailto:|tel:|\/|#)/i;

// Markdown for project descriptions. Raw HTML is shown as text (never executed),
// and links/images may only point at http(s), mailto, tel or the site itself,
// so a description can never carry a script (stored XSS), even one written by AI.
const safeMarked = new Marked({
  async: false,
  breaks: true,
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
    link({ href, title, tokens }) {
      const label = this.parser.parseInline(tokens);
      if (!href || !SAFE_URL.test(href.trim())) return label;
      const t = title ? ` title="${escapeHtml(title)}"` : "";
      const external = /^https?:/i.test(href)
        ? ' rel="noopener noreferrer nofollow" target="_blank"'
        : "";
      return `<a href="${escapeHtml(href)}"${t}${external}>${label}</a>`;
    },
    image({ href, title, text }) {
      if (!href || !/^(https?:|\/)/i.test(href.trim())) return escapeHtml(text ?? "");
      const t = title ? ` title="${escapeHtml(title)}"` : "";
      return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text ?? "")}"${t} loading="lazy" />`;
    },
  },
});

export function renderMarkdown(md: string | null | undefined): string {
  if (!md) return "";
  return safeMarked.parse(md) as string;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

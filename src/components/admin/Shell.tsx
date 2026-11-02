import { Link, useRouterState } from "@tanstack/react-router";
import {
  HelpCircle,
  BadgeDollarSign,
  Briefcase,
  Building2,
  ExternalLink,
  FileSignature,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  Settings,
  Share2,
  Sparkles,
  Tags,
  Wrench,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { getSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/projects", label: "Projects", icon: Briefcase },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/services", label: "Services", icon: Sparkles },
  { to: "/admin/tools", label: "Tools", icon: Wrench },
  { to: "/admin/pricing", label: "Pricing", icon: BadgeDollarSign },
  { to: "/admin/faqs", label: "FAQ", icon: HelpCircle },
  { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { to: "/admin/clients", label: "Client logos", icon: Building2 },
  { to: "/admin/socials", label: "Social links", icon: Share2 },
  { to: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  { to: "/admin/quotes", label: "Quotes", icon: FileSignature },
  { to: "/admin/settings", label: "Site settings", icon: Settings },
  { to: "/admin/account", label: "Account", icon: KeyRound },
] as const;

export function AdminShell({ children, email }: { children: ReactNode; email: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {NAV.map((n) => {
        const active = "exact" in n && n.exact ? pathname === n.to : pathname.startsWith(n.to);
        return (
          <Link
            key={n.to}
            to={n.to}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-radic-red-tint text-radic-red-dark"
                : "text-graphite hover:bg-muted hover:text-ink",
            )}
          >
            <n.icon className="h-4 w-4" />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-mist p-3 text-xs text-graphite">
      <p className="truncate px-3" title={email}>
        {email}
      </p>
      <div className="mt-2 flex gap-1">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted hover:text-ink"
        >
          <ExternalLink className="h-4 w-4" /> View site
        </a>
        <button
          type="button"
          onClick={() => getSupabase().auth.signOut()}
          className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted hover:text-ink"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden h-screen flex-col border-r border-mist bg-white md:sticky md:top-0 md:flex">
        <div className="flex h-16 items-center border-b border-mist px-5">
          <img src="/brand/logo-primary.png" alt="Radic Studio" className="h-9 w-auto" />
          <span className="font-mono ml-auto text-[10px] tracking-widest text-graphite uppercase">
            Studio
          </span>
        </div>
        {nav}
        {footer}
      </aside>

      <div className="flex h-14 items-center justify-between border-b border-mist bg-white px-4 md:hidden">
        <img src="/brand/logo-primary.png" alt="Radic Studio" className="h-8 w-auto" />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          className="rounded-md p-2 hover:bg-muted"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 top-14 z-40 flex flex-col bg-white md:hidden">
          {nav}
          {footer}
        </div>
      )}

      <main className="min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}

export function PageHeader({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink md:text-3xl">{title}</h1>
        {text && <p className="mt-1 text-sm text-graphite">{text}</p>}
      </div>
      {action}
    </div>
  );
}

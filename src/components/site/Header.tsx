import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { SocialIcon, SocialRow, WhatsAppGlyph } from "./SocialIcon";
import { whatsappLink } from "@/lib/format";
import type { SiteSettings, SocialLink } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/work", label: "Work" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

/** Platforms that earn a glyph in the navbar; the rest live in the footer. */
const NAV_SOCIALS = new Set(["x", "instagram"]);

export function Header({ settings, socials }: { settings: SiteSettings; socials: SocialLink[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduce = useReducedMotion();
  const wa = whatsappLink(
    settings.whatsapp_number,
    `Hi ${settings.studio_name}, I'd like to talk about a project.`,
  );
  const navSocials = socials.filter((s) => NAV_SOCIALS.has(s.platform));
  // The hero carries its own buttons, so on the home page the pill waits until you scroll.
  const showCta = (scrolled || pathname !== "/") && !pathname.startsWith("/quote");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300",
          scrolled || open
            ? "border-b border-line bg-paper/85 backdrop-blur-md"
            : "border-b border-transparent bg-paper/0",
        )}
      >
        <div className="container-site flex h-[64px] items-center justify-between md:h-[68px]">
          {/* Left: wordmark, then the pages */}
          <div className="flex items-center gap-7">
            <Link
              to="/"
              className="relative z-50 flex items-center"
              aria-label={`${settings.studio_name} home`}
            >
              <img
                src="/brand/logo-primary.png"
                alt={settings.studio_name}
                className="h-8 w-auto md:h-9"
                width={1600}
                height={599}
              />
            </Link>
            <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "text-[15px] font-medium transition-colors hover:text-ink",
                    pathname.startsWith(n.to) ? "text-ink" : "text-ink/70",
                  )}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: WhatsApp, socials, a divider, then the call to action */}
          <div className="hidden items-center gap-1 md:flex">
            <a
              href={wa}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="WhatsApp"
              title="WhatsApp"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface"
            >
              <WhatsAppGlyph className="h-[18px] w-[18px]" aria-hidden="true" />
            </a>
            {navSocials.map((s) => (
              <SocialIcon key={s.id} link={s} tone="bare" />
            ))}
            <span className="mx-3 h-5 w-px bg-line" aria-hidden="true" />
            <a
              href={`mailto:${settings.email}`}
              className="px-2 text-[15px] font-medium text-ink/70 transition-colors hover:text-ink"
            >
              Email us
            </a>
            {/* The pill grows from zero width, so everything to its left is pushed over smoothly. */}
            <motion.div
              className="overflow-hidden"
              initial={false}
              animate={
                showCta
                  ? { width: "auto", opacity: 1, marginLeft: 8 }
                  : { width: 0, opacity: 0, marginLeft: 0 }
              }
              transition={
                reduce
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 170, damping: 26, mass: 0.9 }
              }
              aria-hidden={!showCta}
            >
              <Link
                to="/quote"
                tabIndex={showCta ? 0 : -1}
                className="font-display inline-flex whitespace-nowrap rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-paper transition-[background-color,transform] hover:bg-ink/85 active:scale-[0.97]"
              >
                Get a price
              </Link>
            </motion.div>
          </div>

          {/* Mobile: WhatsApp glyph and the menu button */}
          <div className="flex items-center gap-1 md:hidden">
            <a
              href={wa}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="WhatsApp"
              className="relative z-50 inline-flex h-11 w-11 items-center justify-center rounded-full text-ink"
            >
              <WhatsAppGlyph className="h-5 w-5" aria-hidden="true" />
            </a>
            <button
              type="button"
              className="relative z-50 flex h-11 w-11 items-center justify-center rounded-full bg-surface"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="relative block h-3.5 w-5">
                <span
                  className={cn(
                    "absolute left-0 top-0 h-0.5 w-5 bg-ink transition-transform duration-300",
                    open && "translate-y-[6px] rotate-45",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 top-[6px] h-0.5 w-5 bg-ink transition-opacity duration-300",
                    open && "opacity-0",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 top-3 h-0.5 w-5 bg-ink transition-transform duration-300",
                    open && "-translate-y-[6px] -rotate-45",
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="site fixed inset-0 z-40 flex h-[100dvh] flex-col overflow-y-auto bg-paper px-6 pb-10 pt-24 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.ul
              className="flex flex-col gap-1"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
              }}
            >
              {NAV.map((n) => (
                <motion.li
                  key={n.to}
                  variants={{
                    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 18 },
                    show: { opacity: 1, y: 0 },
                  }}
                >
                  <Link
                    to={n.to}
                    className={cn(
                      "display-wide block py-3 text-5xl",
                      pathname.startsWith(n.to) ? "text-ink" : "text-ink/60",
                    )}
                  >
                    {n.label}
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
            <div className="mt-auto space-y-6">
              <Link
                to="/quote"
                className="font-display inline-flex rounded-full bg-ink px-6 py-3 text-base font-semibold text-paper"
              >
                Get a price range
              </Link>
              <SocialRow links={socials} />
              <p className="text-sm text-graphite">{settings.tagline}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

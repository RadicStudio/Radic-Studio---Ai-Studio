import { Link } from "@tanstack/react-router";

import { SocialRow } from "./SocialIcon";
import { CookieSettingsLink } from "@/components/site/Consent";
import { whatsappLink } from "@/lib/format";
import type { SiteSettings, SocialLink } from "@/lib/types";

export function Footer({ settings, socials }: { settings: SiteSettings; socials: SocialLink[] }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative -mt-10 overflow-hidden bg-[oklch(0.14_0_0)] pt-10 text-white">
      <img
        src="/brand/mark-white.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -right-10 w-[320px] opacity-[0.07] md:w-[460px]"
        loading="lazy"
      />
      <div className="container-site relative py-16 md:py-24">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="text-sm text-graphite">{settings.tagline}</p>
            <h2 className="display-wide mt-4 text-4xl md:text-6xl">
              Have something worth drawing?
            </h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={whatsappLink(
                  settings.whatsapp_number,
                  `Hi ${settings.studio_name}, I'd like to talk about a project.`,
                )}
                target="_blank"
                rel="noreferrer noopener"
                className="font-display rounded-full bg-white px-6 py-3 text-[15px] font-semibold text-[oklch(0.14_0_0)] transition-colors hover:bg-white/90"
              >
                Chat on WhatsApp
              </a>
              {settings.email && (
                <a
                  href={`mailto:${settings.email}`}
                  className="font-display rounded-full bg-white/10 px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-white/20"
                >
                  {settings.email}
                </a>
              )}
            </div>
            <p className="mt-8 max-w-xl text-sm leading-relaxed text-white/60">
              {settings.studio_name} is a brand, flyer and UI/UX design studio in Enugu, Nigeria,
              founded by Collins Onuora Odoh. Logos and brand identity, event flyers, social media
              design, print and app design for businesses across Nigeria and beyond.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 md:col-span-5">
            <div>
              <p className="text-sm text-white/60">Pages</p>
              <ul className="mt-4 space-y-2 text-[15px]">
                <li>
                  <Link to="/work" className="link-draw">
                    Work
                  </Link>
                </li>
                <li>
                  <Link to="/services" className="link-draw">
                    Services &amp; pricing
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="link-draw">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="link-draw">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="link-draw">
                    Client terms
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="link-draw">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm text-white/60">Contact</p>
              <ul className="mt-4 space-y-2 text-[15px]">
                {settings.phone && (
                  <li>
                    <a href={`tel:${settings.phone}`} className="link-draw">
                      {settings.phone}
                    </a>
                  </li>
                )}
                {settings.email && (
                  <li>
                    <a href={`mailto:${settings.email}`} className="link-draw break-all">
                      {settings.email}
                    </a>
                  </li>
                )}
                {settings.address && <li className="text-white/70">{settings.address}</li>}
              </ul>
              <SocialRow links={socials} tone="light" className="mt-5" />
            </div>
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-white/15 pt-6 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {settings.studio_name}. {settings.footer_note}
          </p>
          <span className="flex items-center gap-5">
            <CookieSettingsLink className="text-white/40 transition-colors hover:text-white" />
            <a href="/admin" className="text-white/40 transition-colors hover:text-white">
              Studio login
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

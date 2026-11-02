import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import {
  loadTrackers,
  readConsent,
  saveConsent,
  trackPageView,
  watchWhatsAppClicks,
  type Consent,
} from "@/lib/analytics";
import type { SiteSettings } from "@/lib/types";

/**
 * Cookie choice + the trackers it unlocks. Renders nothing when no tracking ID is set,
 * so visitors are never asked about cookies the site doesn't use.
 */
export function Analytics({ settings, pathname }: { settings: SiteSettings; pathname: string }) {
  const hasIds = Boolean(settings.meta_pixel_id || settings.ga_measurement_id);
  const [consent, setConsent] = useState<Consent | null | "unknown">("unknown");

  useEffect(() => setConsent(readConsent()), []);

  useEffect(() => {
    if (consent !== "granted" || !hasIds) return;
    loadTrackers({ ga: settings.ga_measurement_id, pixel: settings.meta_pixel_id });
    return watchWhatsAppClicks();
  }, [consent, hasIds, settings.ga_measurement_id, settings.meta_pixel_id]);

  useEffect(() => {
    if (consent === "granted" && hasIds) trackPageView(pathname);
  }, [consent, hasIds, pathname]);

  const choose = (v: Consent) => {
    saveConsent(v);
    setConsent(v);
  };

  const show = hasIds && consent === null && !pathname.startsWith("/q/");

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="dialog"
          aria-label="Cookie choice"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-3 bottom-24 z-50 rounded-2xl border border-line bg-paper p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)] sm:inset-x-auto sm:left-5 sm:max-w-sm md:bottom-7 md:left-7"
        >
          <p className="text-sm leading-relaxed text-ink">
            We use cookies to see which pages and ads bring people here, so we spend less on ads
            that don&apos;t work. Nothing is sold.{" "}
            <Link to="/privacy" className="underline underline-offset-2">
              Privacy policy
            </Link>
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => choose("granted")}
              className="font-display flex-1 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-paper hover:bg-ink/85"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => choose("denied")}
              className="flex-1 rounded-full bg-surface px-4 py-2.5 text-sm font-medium text-ink hover:bg-mist"
            >
              No thanks
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Footer link that lets a visitor change their cookie choice later. */
export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        try {
          window.localStorage.removeItem("rs-cookie-consent");
        } catch {
          /* ignore */
        }
        window.location.reload();
      }}
    >
      Cookie settings
    </button>
  );
}

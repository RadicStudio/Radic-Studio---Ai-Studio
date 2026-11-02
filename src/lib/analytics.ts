/**
 * Ads and analytics: Meta Pixel + Google Analytics 4.
 *
 * Nothing loads until the visitor accepts cookies in the banner (Nigeria Data Protection Act,
 * GAID 2025). IDs come from Studio panel → Site settings → Ads and analytics.
 *
 * Events we send (the ones ads optimise for):
 *   quote_complete  → Meta "Lead"     · a visitor sends their quote brief (WhatsApp or email)
 *   contact_submit  → Meta "Contact"  · the contact form is sent
 *   whatsapp_click  → Meta "Contact"  · any WhatsApp link is tapped
 */

type Params = Record<string, string | number | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[] };
    _fbq?: unknown;
  }
}

const CONSENT_KEY = "rs-cookie-consent";
export type Consent = "granted" | "denied";

export function readConsent(): Consent | null {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function saveConsent(v: Consent) {
  try {
    window.localStorage.setItem(CONSENT_KEY, v);
  } catch {
    /* private mode: the choice lasts for this visit only */
  }
}

let loaded = { ga: "", pixel: "" };

function addScript(src: string) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

/** Loads the trackers whose IDs are set. Safe to call more than once. */
export function loadTrackers(ids: { ga?: string | null; pixel?: string | null }) {
  if (typeof window === "undefined") return;
  const ga = ids.ga?.trim();
  const pixel = ids.pixel?.replace(/\D/g, "");

  if (ga && /^G-[A-Z0-9]+$/.test(ga) && loaded.ga !== ga) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // gtag must push the real `arguments` object.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag("js", new Date());
    // Page views are sent by trackPageView on every route change.
    window.gtag("config", ga, { send_page_view: false });
    addScript(`https://www.googletagmanager.com/gtag/js?id=${ga}`);
    loaded = { ...loaded, ga };
  }

  if (pixel && loaded.pixel !== pixel) {
    if (!window.fbq) {
      const fbq = function (...args: unknown[]) {
        const f = window.fbq!;
        if (f.callMethod) (f.callMethod as (...a: unknown[]) => void)(...args);
        else f.queue!.push(args);
      } as NonNullable<Window["fbq"]> & { push?: unknown; loaded?: boolean; version?: string };
      fbq.queue = [];
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = "2.0";
      window.fbq = fbq;
      window._fbq = fbq;
      addScript("https://connect.facebook.net/en_US/fbevents.js");
    }
    window.fbq!("init", pixel);
    loaded = { ...loaded, pixel };
  }
}

export function trackPageView(path: string) {
  if (typeof window === "undefined") return;
  if (loaded.ga && window.gtag) {
    window.gtag("event", "page_view", {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    });
  }
  if (loaded.pixel && window.fbq) window.fbq("track", "PageView");
}

const META_EVENT: Record<string, string> = {
  quote_complete: "Lead",
  contact_submit: "Contact",
  whatsapp_click: "Contact",
};

export function track(event: keyof typeof META_EVENT, params: Params = {}) {
  if (typeof window === "undefined") return;
  if (loaded.ga && window.gtag) window.gtag("event", event, params);
  if (loaded.pixel && window.fbq) {
    const std = META_EVENT[event];
    if (std) window.fbq("track", std, params);
    window.fbq("trackCustom", event, params);
  }
}

/** Counts every WhatsApp link tap on the site, wherever the button lives. */
export function watchWhatsAppClicks(): () => void {
  const onClick = (e: MouseEvent) => {
    const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!a) return;
    if (/(^|\/\/)(wa\.me|api\.whatsapp\.com)\//.test(a.href)) {
      track("whatsapp_click", { page: window.location.pathname });
    }
  };
  document.addEventListener("click", onClick, { capture: true });
  return () => document.removeEventListener("click", onClick, { capture: true });
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { StickyQuoteBar, WhatsAppFab } from "@/components/site/Bits";
import { Analytics } from "@/components/site/Consent";
import { PageTransition, RouteProgress } from "@/components/site/motion";
import { Toaster } from "@/components/ui/sonner";
import { whatsappLink } from "@/lib/format";
import { fetchSiteShell } from "@/lib/queries";
import { SITE_URL, absoluteUrl } from "@/lib/supabase";
import { DEFAULT_SETTINGS } from "@/lib/types";

function NotFoundComponent() {
  return (
    <div className="container-site flex min-h-[70vh] flex-col items-center justify-center py-32 text-center">
      <img src="/brand/mark-grey.png" alt="" className="w-40 opacity-60" />
      <h1 className="display-wide mt-8 text-5xl text-ink">Off the curve</h1>
      <p className="mt-3 max-w-md text-graphite">
        This page doesn't exist or has moved. Let's get you back to the work.
      </p>
      <Link
        to="/"
        className="font-display mt-8 rounded-full bg-ink px-6 py-3 text-[15px] font-semibold text-paper hover:bg-ink/90"
      >
        Go home
      </Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try again or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-input px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async () => {
    try {
      return await fetchSiteShell();
    } catch (e) {
      console.error(e);
      return { settings: DEFAULT_SETTINGS, socials: [] };
    }
  },
  staleTime: 60_000,
  head: ({ loaderData }) => {
    const s = loaderData?.settings ?? DEFAULT_SETTINGS;
    const title = s.seo_title || s.studio_name;
    const description = s.seo_description || "";
    const og = absoluteUrl(s.og_image_url || "/brand/og-image.jpg");
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title },
        { name: "description", content: description },
        { name: "theme-color", content: "#141414" },
        { name: "robots", content: "index, follow, max-image-preview:large" },
        { property: "og:locale", content: "en_NG" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:image", content: og },
        { property: "og:url", content: SITE_URL },
        { property: "og:site_name", content: s.studio_name },
        { name: "twitter:image", content: og },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Instrument+Serif:ital@1&display=swap",
        },
        { rel: "icon", href: "/brand/icon-32.png", type: "image/png", sizes: "32x32" },
        { rel: "apple-touch-icon", href: "/brand/icon-180.png" },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { settings, socials } = Route.useLoaderData();
  // The page actually on screen. `location` changes the moment a link is clicked, before the
  // next page's data has loaded; keying layout and transitions on it re-animated the OLD page.
  const pathname = useRouterState({
    select: (s) => s.resolvedLocation?.pathname ?? s.location.pathname,
  });
  const isAdmin = pathname.startsWith("/admin");
  // Client quote pages are documents: no site header, footer or floating buttons.
  const isBare = pathname.startsWith("/q/");

  return (
    <QueryClientProvider client={queryClient}>
      {isAdmin ? (
        <Outlet />
      ) : isBare ? (
        <div className="site">
          <Outlet />
        </div>
      ) : (
        <div className="site flex min-h-screen flex-col">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
          >
            Skip to content
          </a>
          <RouteProgress />
          <Header settings={settings} socials={socials} />
          <main id="main" className="relative z-10 flex-1 rounded-b-[2.5rem] bg-paper pb-10">
            <PageTransition pathname={pathname}>
              {/* Required: nested routes render here. */}
              <Outlet />
            </PageTransition>
          </main>
          <Footer settings={settings} socials={socials} />
          <WhatsAppFab
            href={whatsappLink(
              settings.whatsapp_number,
              `Hi ${settings.studio_name}, I'd like to talk about a project.`,
            )}
          />
          <Analytics settings={settings} pathname={pathname} />
          <StickyQuoteBar
            pathname={pathname}
            whatsapp={whatsappLink(
              settings.whatsapp_number,
              `Hi ${settings.studio_name}, I'd like to talk about a project.`,
            )}
          />
        </div>
      )}
      <Toaster position="bottom-center" />
    </QueryClientProvider>
  );
}

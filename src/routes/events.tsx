import { createFileRoute } from "@tanstack/react-router";

import { AdLanding, loadLanding, type LandingConfig } from "@/components/site/AdLanding";
import { absoluteUrl } from "@/lib/supabase";
import { seo } from "@/lib/seo";

const CONFIG: LandingConfig = {
  kind: "event",
  category: "events-nightlife",
  eyebrow: "Event campaigns",
  headline: "Sell out your next",
  serif: "event.",
  subline:
    "Flyer, tickets, banner and an Instagram set that look like one campaign, delivered in 3–7 days.",
  includes: [
    "Main flyer for Instagram and WhatsApp",
    "Ticket design, print-ready",
    "Banner for the venue",
    "Instagram set in post and story sizes",
    "Editable files you own once paid",
  ],
  whatsappText: "Hi Radic Studio, I saw your ad. I'd like a price for an event campaign.",
  workTitle: "Recent event campaigns.",
};

export const Route = createFileRoute("/events")({
  loader: () => loadLanding(CONFIG.category),
  staleTime: 60_000,
  head: ({ loaderData }) =>
    seo(
      "/events",
      "Event Flyer & Campaign Design in Nigeria — From ₦80,000",
      "Event flyer, tickets, venue banner and Instagram set that look like one campaign. From ₦80,000 per event, ready in 3–7 days, print-ready files.",
      loaderData?.work[0]?.cover_url,
    ),
  component: EventsLanding,
});

function EventsLanding() {
  const { services, work, faqs } = Route.useLoaderData();
  return <AdLanding config={CONFIG} services={services} work={work} faqs={faqs} />;
}

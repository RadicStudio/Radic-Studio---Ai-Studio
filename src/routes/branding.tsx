import { createFileRoute } from "@tanstack/react-router";

import { AdLanding, loadLanding, type LandingConfig } from "@/components/site/AdLanding";
import { absoluteUrl } from "@/lib/supabase";
import { seo } from "@/lib/seo";

const CONFIG: LandingConfig = {
  kind: "brand",
  category: "branding",
  eyebrow: "Brand identity",
  headline: "Look established from",
  serif: "day one.",
  subline:
    "A logo, colours and type that your printer, signwriter and social media manager can all follow.",
  includes: [
    "Two first directions to choose from",
    "Final logo in every format, for print and screen",
    "Colour palette and fonts",
    "A short brand guide",
    "Full rights in writing once paid",
  ],
  whatsappText: "Hi Radic Studio, I saw your ad. I'd like a price for a brand identity.",
  workTitle: "Brands we've drawn.",
};

export const Route = createFileRoute("/branding")({
  loader: () => loadLanding(CONFIG.category),
  staleTime: 60_000,
  head: ({ loaderData }) =>
    seo(
      "/branding",
      "Logo & Brand Identity Design in Nigeria — From ₦150,000",
      "Logo, colours, fonts and a short brand guide that make your business look established from day one. Two first directions, full rights. From ₦150,000.",
      loaderData?.work[0]?.cover_url,
    ),
  component: BrandingLanding,
});

function BrandingLanding() {
  const { services, work, faqs } = Route.useLoaderData();
  return <AdLanding config={CONFIG} services={services} work={work} faqs={faqs} />;
}

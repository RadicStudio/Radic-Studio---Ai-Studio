import { absoluteUrl, SITE_URL } from "@/lib/supabase";

/**
 * Per-page search tags: title, description, canonical URL and the matching
 * Open Graph / Twitter tags, so every page has its own snippet and share card.
 */
export function seo(path: string, title: string, description: string, image?: string | null) {
  const url = `${SITE_URL}${path === "/" ? "/" : path}`;
  const og = absoluteUrl(image || "/brand/og-image.jpg");
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: og },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: og },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

type Faq = { question: string; answer: string };

/** FAQPage structured data (eligible for FAQ rich results). */
export function faqJsonLd(faqs: Faq[]) {
  return {
    type: "application/ld+json",
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer.replace(/[*_#>`]/g, "") },
      })),
    }).replace(/</g, "\\u003c"),
  };
}

/** The studio as a local professional service (name, area, contact, prices, socials). */
export function studioJsonLd(s: {
  studio_name: string;
  email?: string | null;
  phone?: string | null;
  socials?: string[];
  services?: { title: string; price_from: number | null }[];
}) {
  const website = {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: s.studio_name,
    alternateName: ["Radic", "Radic Studio Enugu"],
    inLanguage: "en-NG",
    publisher: { "@id": `${SITE_URL}/#studio` },
  };
  return {
    type: "application/ld+json",
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [website, studio(s)],
    }).replace(/</g, "\\u003c"),
  };
}

function studio(s: Parameters<typeof studioJsonLd>[0]) {
  return {
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#studio`,
    name: s.studio_name,
    alternateName: "Radic",
    url: `${SITE_URL}/`,
    logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/logo-badge.png` },
    image: `${SITE_URL}/brand/og-image.jpg`,
    founder: {
      "@type": "Person",
      name: "Collins Onuora Odoh",
      jobTitle: "Founder and designer",
      sameAs: ["https://www.linkedin.com/in/collinsodoh"],
    },
    foundingDate: "2025-09",
    description:
      "Design studio in Enugu, Nigeria: brand identity and logo design, event flyers and campaigns, social media content, print and packaging, and UI/UX design.",
    email: s.email || undefined,
    telephone: s.phone ? `+234${s.phone.replace(/\D/g, "").replace(/^0/, "")}` : undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Enugu",
      addressRegion: "Enugu State",
      addressCountry: "NG",
    },
    areaServed: { "@type": "Country", name: "Nigeria" },
    priceRange: "₦80,000 – ₦1,200,000",
    sameAs: s.socials?.filter(Boolean),
    hasOfferCatalog: s.services?.length
      ? {
          "@type": "OfferCatalog",
          name: "Design services",
          itemListElement: s.services
            .filter((x) => x.price_from)
            .map((x) => ({
              "@type": "Offer",
              itemOffered: { "@type": "Service", name: x.title },
              priceSpecification: {
                "@type": "PriceSpecification",
                price: x.price_from,
                priceCurrency: "NGN",
                minPrice: x.price_from,
              },
            })),
        }
      : undefined,
  };
}

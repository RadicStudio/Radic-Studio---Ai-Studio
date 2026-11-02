import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { SectionHeading } from "@/components/site/Bits";
import { FaqList } from "@/components/site/FaqList";
import { QuoteTile, ServiceCard } from "@/components/site/ServiceCard";
import { CountUp, Reveal } from "@/components/site/motion";
import { formatPrice, whatsappLink } from "@/lib/format";
import { fetchFaqs, fetchPricing, fetchServices } from "@/lib/queries";
import { useSiteShell } from "@/lib/site";
import { cn } from "@/lib/utils";
import { faqJsonLd, seo } from "@/lib/seo";

export const Route = createFileRoute("/services")({
  loader: async () => {
    const [services, pricing, faqs] = await Promise.all([
      fetchServices(),
      fetchPricing(),
      fetchFaqs(),
    ]);
    return { services, pricing, faqs };
  },
  staleTime: 60_000,
  head: ({ loaderData }) => ({
    ...seo(
      "/services",
      "Design Services & Prices in Nigeria — Radic Studio",
      "Starting prices up front: logo and brand identity from ₦150k, event flyers and campaigns from ₦80k, social media from ₦120k a month, print, packaging and UI/UX.",
    ),
    scripts: loaderData?.faqs?.length ? [faqJsonLd(loaderData.faqs)] : [],
  }),
  component: Services,
});

function Services() {
  const { services, pricing, faqs } = Route.useLoaderData();
  const { settings } = useSiteShell();
  const quote = (tier?: string) =>
    whatsappLink(
      settings.whatsapp_number,
      tier
        ? `Hi ${settings.studio_name}, I'd like a quote for the ${tier} package.`
        : `Hi ${settings.studio_name}, I'd like a quote.`,
    );

  return (
    <>
      <section className="section pt-[120px] md:pt-[160px]">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              h1="Graphic design services and prices in Nigeria"
              title="What we can draw for you."
              text="Prices, timelines and revisions up front. Tap any service for a price range in under a minute."
            />
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 md:mt-16 lg:grid-cols-3">
            {services.map((s, i) => (
              <Reveal key={s.id} as="div" delay={(i % 3) * 0.06}>
                <ServiceCard service={s} />
              </Reveal>
            ))}
            {services.length % 3 !== 0 && (
              <Reveal as="div" delay={0.18}>
                <QuoteTile />
              </Reveal>
            )}
          </div>
          <p className="mt-6 text-sm text-graphite">
            Every price is a starting point. You get a fixed price in writing before any work
            begins, with a 50% deposit to start.
          </p>
        </div>
      </section>

      {settings.show_pricing && pricing.length > 0 && (
        <section className="section pt-0">
          <div className="container-site">
            <Reveal>
              <SectionHeading
                title="Clear packages, honest numbers."
                text="Starting points, not ceilings. Every project gets a written scope before any work begins."
              />
            </Reveal>
            <div className="mt-12 grid items-stretch gap-4 md:mt-16 lg:grid-cols-3">
              {pricing.map((t) => {
                const dark = t.is_highlighted;
                return (
                  <div
                    key={t.id}
                    className={cn(
                      "relative flex flex-col rounded-3xl p-8",
                      dark ? "bg-ink text-paper" : "bg-surface text-ink",
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-display text-2xl font-semibold">{t.name}</h3>
                      {dark && (
                        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                          Most popular
                        </span>
                      )}
                    </div>
                    <p className="display-wide mt-5 text-4xl md:text-5xl">
                      {t.price === null ? (
                        "Custom"
                      ) : (
                        <CountUp
                          id={t.id}
                          value={Number(t.price)}
                          format={(n) => formatPrice(n, t.currency)}
                        />
                      )}
                    </p>
                    {t.period && (
                      <p className={cn("mt-2 text-sm", dark ? "text-white/60" : "text-graphite")}>
                        {t.period}
                      </p>
                    )}
                    <ul className="mt-7 space-y-3 text-[15px]">
                      {t.features.map((f) => (
                        <li key={f} className="flex gap-3">
                          <Check
                            className={cn(
                              "mt-1 h-4 w-4 shrink-0",
                              dark ? "text-white/70" : "text-signal",
                            )}
                            aria-hidden="true"
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-8 lg:mt-auto lg:pt-8">
                      <a
                        href={quote(t.name)}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={cn(
                          "font-display inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-semibold transition-colors",
                          dark
                            ? "bg-white text-ink hover:bg-white/90"
                            : "bg-paper text-ink hover:bg-ink hover:text-paper",
                        )}
                      >
                        Request a quote
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-10 text-sm text-graphite">
              Need something that doesn't fit a package?{" "}
              <a
                href={quote()}
                target="_blank"
                rel="noreferrer noopener"
                className="link-draw text-ink"
              >
                Message us and we'll scope it.
              </a>
            </p>
          </div>
        </section>
      )}
      {faqs.length > 0 && (
        <section className="section pt-0">
          <div className="container-site grid gap-10 md:grid-cols-12">
            <div className="md:col-span-4">
              <SectionHeading
                title="Questions, answered."
                text="Cost, timelines, payments, files and rights. Still unsure? Ask us on WhatsApp."
              />
            </div>
            <div className="md:col-span-8">
              <FaqList faqs={faqs} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}

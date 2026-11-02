import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Check } from "lucide-react";

import { ButtonA, SectionHeading } from "@/components/site/Bits";
import { FaqList } from "@/components/site/FaqList";
import { ProjectCard } from "@/components/site/ProjectCard";
import { servicePrice } from "@/components/site/ServiceCard";
import { WhatsAppGlyph } from "@/components/site/SocialIcon";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/motion";
import { whatsappLink } from "@/lib/format";
import { fetchFaqs, fetchProjects, fetchServices } from "@/lib/queries";
import { useSiteShell } from "@/lib/site";
import type { Faq, Project, Service } from "@/lib/types";

/**
 * One page per ad offer. Ads send people here instead of the homepage, so everything on the
 * page is about the one service the ad promised, with one main action: get a price range.
 */
export type LandingConfig = {
  /** services.kind */
  kind: string;
  /** categories.slug used to pick the work shown */
  category: string;
  eyebrow: string;
  headline: string;
  serif: string;
  subline: string;
  includes: string[];
  whatsappText: string;
  workTitle: string;
};

export async function loadLanding(category: string) {
  const [services, projects, faqs] = await Promise.all([
    fetchServices(),
    fetchProjects(),
    fetchFaqs(),
  ]);
  const work = projects
    .filter((p) => p.category?.slug === category && p.cover_url)
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
    .slice(0, 6);
  return { services, work, faqs };
}

const STEPS = [
  {
    title: "Get your price range",
    text: "Six quick taps on the quote page, no typing. You see a price range before you talk to anyone.",
  },
  {
    title: "Agree a fixed price",
    text: "We send a written quote you can sign online. Pay a 50% deposit and the work starts.",
  },
  {
    title: "Get files you own",
    text: "Two rounds of changes, then print-ready and editable files, with full rights in writing once paid.",
  },
];

const primaryBtn =
  "group/btn font-display inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[15px] font-semibold text-paper transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-ink/85 active:scale-[0.97]";

export function AdLanding({
  config: c,
  services,
  work,
  faqs,
}: {
  config: LandingConfig;
  services: Service[];
  work: Project[];
  faqs: Faq[];
}) {
  const { settings } = useSiteShell();
  const service = services.find((s) => s.kind === c.kind);
  const price = service ? servicePrice(service) : null;
  const wa = whatsappLink(settings.whatsapp_number, c.whatsappText);
  const quoteSearch = service ? { service: service.id } : {};

  const facts = service
    ? [
        service.turnaround && { label: "Turnaround", value: service.turnaround },
        service.concepts && { label: "First directions", value: String(service.concepts) },
        service.revisions && { label: "Rounds of changes", value: String(service.revisions) },
      ].filter(Boolean)
    : [];

  return (
    <>
      {/* Hero: the offer, its price, one action. */}
      <section className="pt-[120px] pb-14 md:pt-[160px] md:pb-20">
        <div className="container-site grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <Reveal>
            <p className="text-sm text-graphite">{c.eyebrow}</p>
            <h1 className="display-wide mt-4 text-[clamp(40px,7vw,88px)] text-ink">
              {c.headline} <span className="serif-note">{c.serif}</span>
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-graphite md:text-xl md:leading-snug">
              {c.subline}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/quote" search={quoteSearch} className={primaryBtn}>
                Get my price range
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href={wa}
                target="_blank"
                rel="noreferrer noopener"
                className="font-display inline-flex items-center justify-center gap-2 rounded-full bg-surface px-6 py-3.5 text-[15px] font-semibold text-ink transition-colors hover:bg-mist"
              >
                <WhatsAppGlyph className="h-4 w-4" aria-hidden="true" />
                Ask on WhatsApp
              </a>
            </div>
            {settings.reply_promise && (
              <p className="mt-4 text-sm text-graphite">{settings.reply_promise}</p>
            )}
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-3xl bg-ink p-8 text-paper md:p-10">
              <p className="text-sm text-white/60">{service?.title ?? c.eyebrow}</p>
              {price && (
                <p className="mt-3">
                  {price.lead && <span className="text-white/60">{price.lead} </span>}
                  <span className="display-wide text-5xl md:text-6xl">{price.amount}</span>
                  {price.note && <span className="text-white/60"> {price.note}</span>}
                </p>
              )}
              {facts.length > 0 && (
                <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-white/15 pt-6 text-sm">
                  {facts.map(
                    (f) =>
                      f && (
                        <div key={f.label}>
                          <dt className="text-white/60">{f.label}</dt>
                          <dd className="mt-1 font-medium">{f.value}</dd>
                        </div>
                      ),
                  )}
                </dl>
              )}
              <ul className="mt-8 space-y-3 text-[15px]">
                {c.includes.map((it) => (
                  <li key={it} className="flex gap-3">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-white/70" aria-hidden="true" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-xs text-white/50">
                A starting price. You get a fixed price in writing before any work begins.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Proof: real work of this kind. */}
      {work.length > 0 && (
        <section className="section pt-0">
          <div className="container-site">
            <Reveal>
              <SectionHeading title={c.workTitle} />
            </Reveal>
            <RevealGroup className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:mt-14 md:grid-cols-3 md:gap-x-6">
              {work.map((p, i) => (
                <RevealItem key={p.id}>
                  <ProjectCard project={p} priority={i < 3} />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}

      {/* How it works. */}
      <section className="section pt-0">
        <div className="container-site">
          <Reveal>
            <SectionHeading title="How it works." />
          </Reveal>
          <ol className="mt-10 grid gap-4 md:mt-14 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} as="li" delay={i * 0.06}>
                <div className="h-full rounded-3xl bg-surface p-7">
                  <p className="font-mono text-sm text-graphite">0{i + 1}</p>
                  <h3 className="font-display mt-6 text-xl font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-graphite">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="section pt-0">
          <div className="container-site grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <Reveal>
              <SectionHeading title="Questions, answered." />
            </Reveal>
            <FaqList faqs={faqs} />
          </div>
        </section>
      )}

      {/* Closing action. */}
      <section className="section pt-0">
        <div className="container-site">
          <Reveal>
            <div className="flex flex-col items-start gap-6 rounded-3xl bg-ink p-8 text-paper md:flex-row md:items-center md:justify-between md:p-12">
              <div>
                <h2 className="display-wide text-3xl md:text-4xl">
                  Know the price <span className="serif-note">before you ask.</span>
                </h2>
                <p className="mt-3 text-white/70">Six taps. Under a minute. No typing.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/quote"
                  search={quoteSearch}
                  className="font-display inline-flex items-center gap-2 rounded-full bg-paper px-6 py-3.5 text-[15px] font-semibold text-ink hover:bg-mist"
                >
                  Get my price range
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <ButtonA href={wa} variant="ghost">
                  WhatsApp
                </ButtonA>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

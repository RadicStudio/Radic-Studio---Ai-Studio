import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Fragment, useEffect, useState, type ReactNode } from "react";

import { ButtonA, ButtonLink } from "@/components/site/Bits";
import { QuoteTile, ServiceCard } from "@/components/site/ServiceCard";
import { PenToolMark } from "@/components/site/PenToolMark";
import { ProjectCard } from "@/components/site/ProjectCard";
import { Reveal, SplitReveal } from "@/components/site/motion";
import { whatsappLink } from "@/lib/format";
import { fetchProjects, fetchServices } from "@/lib/queries";
import { useSiteShell } from "@/lib/site";
import type { Project } from "@/lib/types";
import { seo, studioJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [featured, services] = await Promise.all([
      fetchProjects({ featured: true, limit: 6 }),
      fetchServices(),
    ]);
    return { featured, services };
  },
  staleTime: 60_000,
  head: ({ loaderData }) => ({
    ...seo(
      "/",
      "Radic Studio — Brand, Flyer & UI/UX Design in Enugu, Nigeria",
      "Design studio in Enugu for Nigerian businesses: logos and brand identity from ₦150k, event flyers from ₦80k, social media and UI/UX design. Prices up front.",
    ),
    scripts: [
      studioJsonLd({
        studio_name: "Radic Studio",
        email: "radic.studio@gmail.com",
        phone: "08133037674",
        socials: [
          "https://www.instagram.com/radic_studio",
          "https://www.facebook.com/radicstudio",
          "https://x.com/radic_studio",
          "https://www.linkedin.com/in/collinsodoh",
        ],
        services: loaderData?.services,
      }),
    ],
  }),
  component: Home,
});

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * One slot inside the headline: a small cover that flips to the next project every few seconds
 * (each slot on its own rhythm, as Mobbin does). Pauses when the tab is hidden or motion is reduced.
 */
function HeroSlot({
  pool,
  start,
  period,
  delay,
}: {
  pool: Project[];
  start: number;
  period: number;
  delay: number;
}) {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(start % pool.length);

  useEffect(() => {
    if (reduce || pool.length < 2) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const run = () => {
      clearInterval(timer);
      if (document.hidden) return;
      timer = setInterval(() => setIdx((i) => (i + 1) % pool.length), period);
    };
    const kick = setTimeout(run, delay);
    document.addEventListener("visibilitychange", run);
    return () => {
      clearTimeout(kick);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", run);
    };
  }, [reduce, pool.length, period, delay]);

  const p = pool[idx];
  if (!p) return null;
  return (
    <Link
      to="/work/$slug"
      params={{ slug: p.slug }}
      className="group/slot relative mx-[0.12em] inline-block h-[0.82em] w-[0.82em] align-[-0.1em] [perspective:600px]"
      aria-label={p.title}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.img
          key={p.id}
          src={p.cover_url ?? ""}
          alt=""
          className="absolute inset-0 h-full w-full rounded-[0.22em] bg-surface object-cover transition-transform duration-500 group-hover/slot:-rotate-6 group-hover/slot:scale-105"
          initial={reduce ? { opacity: 0 } : { rotateY: -90, opacity: 0, scale: 0.8 }}
          animate={{ rotateY: 0, opacity: 1, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { rotateY: 90, opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.55, ease: EASE }}
          style={{ backfaceVisibility: "hidden" }}
        />
      </AnimatePresence>
    </Link>
  );
}

/**
 * Headline tokens. A word wrapped in *asterisks* (set in the admin panel) is rendered in the
 * serif italic. Two slots between words carry covers from featured work, so the first thing a
 * visitor sees is the studio's own output, changing as they read.
 */
function HeroHeadline({ text, thumbs }: { text: string; thumbs: Project[] }) {
  const reduce = useReducedMotion();
  const words = text.split(/\s+/).filter(Boolean);
  const pool = thumbs.filter((p) => p.cover_url);
  const positions = pool.length ? [1, 3].filter((i) => i < words.length - 1) : [];

  const items: ReactNode[] = [];
  words.forEach((raw, i) => {
    const serif = /^\*[^*]+\*[.,!?]?$/.test(raw);
    const word = serif ? raw.replace(/\*/g, "") : raw;
    items.push(
      <span key={`w${i}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
        <motion.span
          className={serif ? "serif-note inline-block pr-[0.04em]" : "inline-block"}
          initial={reduce ? { opacity: 0 } : { y: "110%" }}
          animate={reduce ? { opacity: 1 } : { y: 0 }}
          transition={{ duration: 0.9, delay: 0.25 + i * 0.06, ease: EASE }}
        >
          {word}
        </motion.span>
      </span>,
    );
    const slot = positions.indexOf(i);
    if (slot >= 0) {
      items.push(
        <motion.span
          key={`t${i}`}
          className="inline-block"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.5 + i * 0.06, ease: EASE }}
        >
          <HeroSlot
            pool={pool}
            start={slot * Math.ceil(pool.length / 2)}
            period={3200}
            delay={2600 + slot * 1600}
          />
        </motion.span>,
      );
    }
    if (i < words.length - 1) items.push(<Fragment key={`s${i}`}> </Fragment>);
  });

  return (
    <p className="display-wide mx-auto max-w-5xl text-[clamp(40px,8vw,104px)] text-ink">{items}</p>
  );
}

function Home() {
  const { featured, services } = Route.useLoaderData();
  const { settings } = useSiteShell();
  const talk = whatsappLink(
    settings.whatsapp_number,
    `Hi ${settings.studio_name}, I'd like to talk about a project.`,
  );

  return (
    <>
      {/* Hero — centred, text first, the mark draws itself once above the headline. */}
      <section className="relative overflow-hidden pt-[128px] pb-16 text-center md:pt-[160px] md:pb-24">
        <div className="container-site flex flex-col items-center">
          <PenToolMark className="w-[72px] text-ink md:w-[88px]" />
          {/* The page's main heading for search: brand, what we do, where. The big slogan below is display text. */}
          <h1 className="mt-6 text-sm font-medium tracking-wide text-graphite">
            {settings.studio_name} · Brand, flyer &amp; UI/UX design studio in Enugu, Nigeria
          </h1>
          {settings.availability_text ? (
            <motion.p
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-sm text-ink"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {settings.availability_text}
            </motion.p>
          ) : (
            <motion.p
              className="mt-4 text-sm text-graphite"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              {settings.tagline}
            </motion.p>
          )}
          <div className="mt-5">
            <HeroHeadline text={settings.hero_headline} thumbs={featured} />
          </div>
          {settings.hero_subline && (
            <motion.p
              className="mx-auto mt-7 max-w-2xl text-[17px] leading-relaxed text-graphite md:text-xl md:leading-snug"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.85, ease: EASE }}
            >
              {settings.hero_subline}
            </motion.p>
          )}
          <motion.div
            className="mt-9 flex flex-wrap justify-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1, ease: EASE }}
          >
            <ButtonLink to={settings.hero_cta_url || "/quote"}>
              {settings.hero_cta_text || "Get a price range"}
            </ButtonLink>
            {(settings.hero_cta_url || "/quote") === "/work" ? (
              <ButtonA href={talk} variant="ghost">
                Talk to us
              </ButtonA>
            ) : (
              <ButtonLink to="/work" variant="ghost">
                See the work
              </ButtonLink>
            )}
          </motion.div>
        </div>
      </section>

      {/* Selected work — six pieces, one calm grid. */}
      <section className="section pt-0">
        <div className="container-site">
          <div className="flex items-end justify-between gap-6">
            <SplitReveal
              as="h2"
              text="Selected work"
              className="display-wide text-[34px] text-ink sm:text-4xl md:text-5xl"
            />
            <Link to="/work" className="link-draw text-[15px] text-graphite hover:text-ink">
              All projects
            </Link>
          </div>
          {featured.length ? (
            <div className="wall mt-10 md:mt-14">
              {featured.map((p, i) => (
                <ProjectCard key={p.id} project={p} priority={i < 3} />
              ))}
            </div>
          ) : (
            <div className="panel mt-12 p-12 text-center text-graphite">
              Featured projects will appear here once they're published from the studio panel.
            </div>
          )}
        </div>
      </section>

      {/* What we do — the service cards. */}
      {services.length > 0 && (
        <section className="section pt-0">
          <div className="container-site">
            <div className="mx-auto max-w-2xl text-center">
              <SplitReveal
                as="h2"
                text="What we do"
                className="display-wide text-[34px] text-ink sm:text-4xl md:text-5xl"
              />
              <Reveal as="div" delay={0.2}>
                <p className="mt-4 text-[17px] leading-relaxed text-graphite md:text-xl md:leading-snug">
                  Interfaces, identities and print, drawn by one hand so they belong together.
                </p>
              </Reveal>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 md:mt-14 lg:grid-cols-4">
              {services.map((s, i) => (
                <Reveal key={s.id} as="div" delay={(i % 4) * 0.06}>
                  <ServiceCard service={s} size="sm" />
                </Reveal>
              ))}
              {services.length % 4 !== 0 && (
                <Reveal as="div" delay={0.24}>
                  <QuoteTile />
                </Reveal>
              )}
            </div>
            <div className="mt-8 flex justify-center">
              <ButtonLink to="/services" variant="ghost">
                Services and pricing
              </ButtonLink>
            </div>
          </div>
        </section>
      )}

      {/* Closing */}
      <section className="section pt-0">
        <div className="container-site text-center">
          <SplitReveal
            as="h2"
            text="Tell us what you're building."
            serif={["building"]}
            className="display-wide mx-auto max-w-3xl text-[40px] text-ink sm:text-5xl md:text-7xl"
          />
          <Reveal as="div" delay={0.25}>
            <p className="mx-auto mt-6 max-w-md text-[17px] leading-relaxed text-graphite md:text-xl md:leading-snug">
              Send a brief, a sketch or a single sentence. We'll come back with questions and a
              plan.
            </p>
          </Reveal>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/contact">Start a conversation</ButtonLink>
            <ButtonA
              href={whatsappLink(
                settings.whatsapp_number,
                `Hi ${settings.studio_name}, I'd like a quote.`,
              )}
              variant="ghost"
            >
              WhatsApp us
            </ButtonA>
          </div>
        </div>
      </section>
    </>
  );
}

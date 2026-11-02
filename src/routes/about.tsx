import { createFileRoute } from "@tanstack/react-router";

import { ButtonLink, Marquee, SectionHeading } from "@/components/site/Bits";
import { LetterReveal, Reveal, SplitReveal } from "@/components/site/motion";
import { fetchClientLogos, fetchTestimonials } from "@/lib/queries";
import { useSiteShell } from "@/lib/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  loader: async () => {
    const [clients, testimonials] = await Promise.all([fetchClientLogos(), fetchTestimonials()]);
    return { clients, testimonials };
  },
  staleTime: 60_000,
  head: () =>
    seo(
      "/about",
      "About Radic Studio — Design Studio in Enugu, Nigeria",
      "Radic Studio is a brand, print and UI/UX design studio in Enugu, founded by Collins Onuora Odoh. How we work, how we use AI, and what every client gets.",
    ),
  component: About,
});

const WORDS = [
  {
    latin: "lux",
    meaning: "light",
    text: "Clarity. Work that is easy to read and hard to forget.",
  },
  {
    latin: "radix",
    meaning: "root",
    text: "Foundations. We find the one true idea before we draw a line.",
  },
  {
    latin: "creatio",
    meaning: "creation",
    text: "Craft. Hand-drawn, vector-refined, built to be used.",
  },
];

function About() {
  const { clients, testimonials } = Route.useLoaderData();
  const { settings } = useSiteShell();
  const steps = settings.process_steps ?? [];

  return (
    <>
      <section className="section pt-[120px] md:pt-[160px]">
        <div className="container-site grid gap-12 md:grid-cols-12 md:items-center">
          <Reveal className="md:col-span-7">
            <SectionHeading
              h1={`About ${settings.studio_name}, a design studio in Enugu, Nigeria`}
              title={`${settings.studio_name} is a design company.`}
            />
            {settings.about_story && (
              <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-graphite md:text-lg">
                {settings.about_story}
              </p>
            )}
            <div className="mt-8">
              <ButtonLink to="/work" variant="ghost">
                See the work
              </ButtonLink>
            </div>
          </Reveal>
          <Reveal className="md:col-span-5" delay={0.15}>
            <img
              src="/brand/logo-badge.png"
              alt={`${settings.studio_name} badge`}
              className="mx-auto w-[60%] max-w-[320px] md:w-[80%]"
              width={1024}
              height={1025}
            />
          </Reveal>
        </div>
      </section>

      <section className="section pt-0">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              title={<span className="lowercase">{settings.tagline}</span>}
              text="Three Latin words. One way of working."
            />
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {WORDS.map((w, i) => (
              <div
                key={w.latin}
                className="panel group p-7 transition-[background-color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-mist md:p-8"
              >
                <p className="serif-note text-5xl lowercase text-ink md:text-6xl">
                  <LetterReveal text={w.latin} delay={i * 0.25} />
                </p>
                <p className="mt-2 flex items-baseline gap-2 text-sm text-graphite">
                  <span className="inline-block h-px w-5 bg-graphite/50 transition-all duration-500 group-hover:w-10 group-hover:bg-ink" />
                  <span className="transition-colors duration-300 group-hover:text-ink">
                    {w.meaning}
                  </span>
                </p>
                <Reveal as="div" delay={0.5 + i * 0.25}>
                  <p className="mt-4 text-[15px] leading-relaxed text-graphite">{w.text}</p>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {settings.ai_statement && (
        <section className="section pt-0">
          <div className="container-site">
            <div className="grid gap-8 rounded-3xl bg-ink p-8 text-paper md:grid-cols-12 md:p-14">
              <div className="md:col-span-4">
                <p className="text-sm text-paper/60">How we use AI</p>
                <SplitReveal
                  as="h2"
                  text="AI-assisted process. Human-made work."
                  serif={["Human-made"]}
                  className="display-wide mt-3 text-[34px] sm:text-4xl md:text-5xl"
                />
              </div>
              <Reveal as="div" delay={0.15} className="md:col-span-8">
                <p className="text-[17px] leading-relaxed text-paper/80 md:text-lg">
                  {settings.ai_statement}
                </p>
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {steps.length > 0 && (
        <section className="section pt-0">
          <div className="container-site">
            <Reveal>
              <SectionHeading title="How a project runs." />
            </Reveal>
            <ol className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <li key={i} className="panel p-6">
                  <p className="text-sm text-graphite">Step {i + 1}</p>
                  <h3 className="font-display mt-2 text-2xl font-medium text-ink">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-graphite">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {clients.length > 0 && (
        <section className="section pt-0">
          <div className="container-site">
            <p className="mb-6 text-sm text-graphite">Brands we've worked with</p>
          </div>
          <Marquee speed={Math.max(20, clients.length * 6)}>
            {clients.map((c) => (
              <div key={c.id} className="flex h-12 items-center">
                {c.logo_url ? (
                  <img
                    src={c.logo_url}
                    alt={c.name}
                    className="h-9 w-auto max-w-[160px] object-contain opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0"
                    loading="lazy"
                  />
                ) : (
                  <span className="font-display text-xl font-medium text-graphite">{c.name}</span>
                )}
              </div>
            ))}
          </Marquee>
        </section>
      )}

      {testimonials.length > 0 && (
        <section className="section pt-0">
          <div className="container-site">
            <Reveal>
              <SectionHeading title="What clients say." />
            </Reveal>
            <div className="mt-12 grid gap-10 md:grid-cols-3">
              {testimonials.slice(0, 3).map((t) => (
                <figure key={t.id} className="panel flex flex-col p-7">
                  <blockquote className="font-display text-xl font-medium leading-snug text-ink">
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 text-sm text-graphite">
                    {t.avatar_url && (
                      <img
                        src={t.avatar_url}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover"
                        loading="lazy"
                      />
                    )}
                    <div>
                      <p className="text-ink">{t.author_name}</p>
                      <p>{[t.author_role, t.company].filter(Boolean).join(", ")}</p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";

import { ButtonA } from "@/components/site/Bits";
import { ToolIcon } from "@/components/site/ToolIcon";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/motion";
import { renderMarkdown, whatsappLink } from "@/lib/format";
import { fetchProject } from "@/lib/queries";
import { SITE_URL, absoluteUrl } from "@/lib/supabase";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSiteShell } from "@/lib/site";

export const Route = createFileRoute("/work/$slug")({
  loader: async ({ params }) => {
    const data = await fetchProject(params.slug);
    if (!data) throw notFound();
    return data;
  },
  staleTime: 60_000,
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.project.title} — Radic Studio` },
          { name: "description", content: loaderData.project.summary ?? "" },
          { property: "og:title", content: loaderData.project.title },
          { property: "og:url", content: `${SITE_URL}/work/${loaderData.project.slug}` },
          {
            property: "og:image",
            content: absoluteUrl(loaderData.project.cover_url ?? "/brand/logo-badge.png"),
          },
        ]
      : [],
    links: loaderData
      ? [{ rel: "canonical", href: `${SITE_URL}/work/${loaderData.project.slug}` }]
      : [],
  }),
  component: ProjectPage,
});

function ProjectPage() {
  const { project, images, prev, next, tools } = Route.useLoaderData();
  const toolByName = new Map(tools.map((t) => [t.name.toLowerCase(), t]));
  const { settings } = useSiteShell();
  const reduce = useReducedMotion();

  return (
    <article className="pt-[112px] md:pt-[140px]">
      <div className="container-site">
        <Reveal>
          <Link to="/work" className="link-draw text-sm text-graphite hover:text-ink">
            All work
          </Link>
          <div className="mt-6 grid gap-8 md:grid-cols-12 md:items-end">
            <div className="md:col-span-8">
              {project.category && <p className="text-sm text-signal">{project.category.name}</p>}
              <h1 className="display-wide mt-3 text-4xl text-ink md:text-6xl">{project.title}</h1>
              {project.summary && (
                <p className="mt-5 max-w-2xl text-lg text-graphite">{project.summary}</p>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm md:col-span-4">
              {project.client && (
                <div>
                  <dt className="text-graphite">Client</dt>
                  <dd className="mt-1 text-ink">{project.client}</dd>
                </div>
              )}
              {project.year && (
                <div>
                  <dt className="text-graphite">Year</dt>
                  <dd className="mt-1 text-ink">{project.year}</dd>
                </div>
              )}
              {project.tools.length > 0 && (
                <div className="col-span-2">
                  <dt className="text-graphite">Tools</dt>
                  <dd className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
                    {project.tools.map((t) => (
                      <span key={t} className="flex items-center gap-2.5" title={t}>
                        <ToolIcon name={t} tool={toolByName.get(t.toLowerCase())} size={36} />
                        <span className="text-sm text-ink">{t}</span>
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </Reveal>

        {project.cover_url && (
          <motion.div
            {...(reduce ? {} : { layoutId: `cover-${project.id}` })}
            className="mt-12 overflow-hidden rounded-3xl bg-surface"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src={project.cover_url}
              alt={project.cover_alt ?? project.title}
              className="block w-full object-cover"
              fetchPriority="high"
            />
          </motion.div>
        )}

        {project.description && (
          <Reveal className="mx-auto mt-16 max-w-3xl">
            <div
              className="prose-radic"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(project.description) }}
            />
          </Reveal>
        )}

        {images.length > 0 && (
          <RevealGroup className="mt-16 grid gap-6 md:grid-cols-2">
            {images.map((im, i) => (
              <RevealItem
                key={im.id}
                className={images.length % 2 === 1 && i === 0 ? "md:col-span-2" : ""}
              >
                <figure>
                  <img
                    src={im.url}
                    alt={im.alt ?? ""}
                    loading="lazy"
                    decoding="async"
                    className="block w-full rounded-3xl bg-surface object-cover"
                  />
                  {im.caption && (
                    <figcaption className="mt-2 text-xs text-graphite">{im.caption}</figcaption>
                  )}
                </figure>
              </RevealItem>
            ))}
          </RevealGroup>
        )}

        <Reveal className="mt-20 border-t border-line pt-12 md:pt-16">
          <h2 className="display-wide text-3xl text-ink md:text-5xl">
            Like this? Let's make yours.
          </h2>
          <div className="mt-6 flex">
            <ButtonA
              href={whatsappLink(
                settings.whatsapp_number,
                `Hi ${settings.studio_name}, I saw "${project.title}" and I'd like something similar.`,
              )}
            >
              Chat on WhatsApp
            </ButtonA>
          </div>
        </Reveal>

        <nav
          className="mt-16 grid gap-4 border-t border-line py-10 sm:grid-cols-2"
          aria-label="Project navigation"
        >
          {prev ? <NavCard project={prev} label="Previous" /> : <span />}
          {next && <NavCard project={next} label="Next" align="right" />}
        </nav>
      </div>
    </article>
  );
}

function NavCard({
  project,
  label,
  align = "left",
}: {
  project: Project;
  label: string;
  align?: "left" | "right";
}) {
  return (
    <Link
      to="/work/$slug"
      params={{ slug: project.slug }}
      className={cn(
        "group flex items-center gap-4 rounded-2xl p-2 transition-colors hover:bg-surface",
        align === "right" && "sm:flex-row-reverse sm:text-right",
      )}
    >
      <span className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-surface">
        {project.cover_url && (
          <img
            src={project.cover_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-graphite">{label}</span>
        <span className="font-display mt-1 block text-lg font-medium text-ink md:text-xl">
          {project.title}
        </span>
        {project.category && (
          <span className="mt-0.5 block text-xs text-graphite">{project.category.name}</span>
        )}
      </span>
    </Link>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";

import { SectionHeading } from "@/components/site/Bits";
import { ProjectCard } from "@/components/site/ProjectCard";
import { Reveal } from "@/components/site/motion";
import { fetchCategories, fetchProjects } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/work/")({
  loader: async () => {
    const [projects, categories] = await Promise.all([fetchProjects(), fetchCategories()]);
    return { projects, categories };
  },
  staleTime: 60_000,
  head: () =>
    seo(
      "/work",
      "Design Portfolio: Logos, Flyers & Social Media | Radic Studio",
      "Real projects for Nigerian brands and events: brand identities, event flyers and tickets, social media campaigns, packaging, print and app design.",
    ),
  component: Work,
});

function Work() {
  const { projects, categories } = Route.useLoaderData();
  const [active, setActive] = useState<string>("all");

  const used = useMemo(
    () => categories.filter((c) => projects.some((p) => p.category_id === c.id)),
    [categories, projects],
  );
  const shown = useMemo(
    () => (active === "all" ? projects : projects.filter((p) => p.category_id === active)),
    [active, projects],
  );

  return (
    <section className="section pt-[120px] md:pt-[160px]">
      <div className="container-site">
        <Reveal>
          <SectionHeading
            h1="Radic Studio portfolio: logos, flyers, social media and UI/UX design"
            title="Everything we've drawn."
            text="Interfaces, identities, print, events and illustration. Filter by craft or browse the lot."
          />
        </Reveal>

        {used.length > 0 && (
          <Reveal className="mt-10 flex flex-wrap gap-2" delay={0.1}>
            <FilterPill active={active === "all"} onClick={() => setActive("all")}>
              All <span className="ml-1 opacity-60">{projects.length}</span>
            </FilterPill>
            {used.map((c) => (
              <FilterPill key={c.id} active={active === c.id} onClick={() => setActive(c.id)}>
                {c.name}{" "}
                <span className="ml-1 opacity-60">
                  {projects.filter((p) => p.category_id === c.id).length}
                </span>
              </FilterPill>
            ))}
          </Reveal>
        )}

        {shown.length ? (
          <motion.div layout className="wall mt-12">
            <AnimatePresence mode="popLayout">
              {shown.map((p, i) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{
                    duration: 0.45,
                    delay: Math.min(i, 8) * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <ProjectCard project={p} priority={i < 3} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="panel mt-12 p-12 text-center text-graphite">
            {projects.length
              ? "Nothing in this category yet."
              : "Projects will appear here once they're published from the studio panel."}
          </div>
        )}
      </div>
    </section>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active ? "bg-ink text-paper" : "bg-surface text-graphite hover:bg-mist hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

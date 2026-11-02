import { Link } from "@tanstack/react-router";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useRef, useState } from "react";

import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProjectCard({
  project,
  priority = false,
  className,
}: {
  project: Project;
  priority?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const [hover, setHover] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 28 });
  const sy = useSpring(y, { stiffness: 300, damping: 28 });

  return (
    <Link
      ref={ref}
      to="/work/$slug"
      params={{ slug: project.slug }}
      className={cn("group relative block cursor-none", className)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set(e.clientX - r.left);
        y.set(e.clientY - r.top);
      }}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-surface">
        {project.cover_url ? (
          <motion.img
            {...(reduce ? {} : { layoutId: `cover-${project.id}` })}
            src={project.cover_url}
            alt={project.cover_alt ?? project.title}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="block h-full w-full object-cover transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-graphite">
            <img src="/brand/mark-grey.png" alt="" className="w-1/3 opacity-30" />
          </div>
        )}
        {project.category && (
          <span className="font-display absolute bottom-3 left-3 translate-y-2 rounded-full bg-paper/90 px-3 py-1 text-xs font-medium text-ink opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            {project.category.name}
          </span>
        )}
        {!reduce && (
          <motion.div
            aria-hidden="true"
            className="font-display pointer-events-none absolute left-0 top-0 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-xs font-semibold text-paper"
            style={{ x: sx, y: sy }}
            initial={false}
            animate={{ scale: hover ? 1 : 0, opacity: hover ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            view
          </motion.div>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-[15px] font-medium text-ink md:text-base">
          {project.title}
        </h3>
        {project.year && <span className="shrink-0 text-xs text-graphite">{project.year}</span>}
      </div>
      {project.client && <p className="mt-0.5 text-sm text-graphite">{project.client}</p>}
    </Link>
  );
}

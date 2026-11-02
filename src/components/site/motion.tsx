import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type HTMLMotionProps,
} from "motion/react";
import { useRouterState } from "@tanstack/react-router";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fades content up 24px as it enters the viewport, once. */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "article";
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.5, delay, ease: EASE }}
    >
      {children}
    </Comp>
  );
}

/** Staggers its direct children's reveal (use with <RevealItem/>). */
export function RevealGroup({
  children,
  className,
  stagger = 0.06,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
  ...rest
}: { children: ReactNode; className?: string } & HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** A button that leans toward the cursor on hover. */
export function Magnetic({
  children,
  className,
  strength = 8,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18 });
  const sy = useSpring(y, { stiffness: 220, damping: 18 });

  return (
    <motion.div
      ref={ref}
      className={cn("inline-block", className)}
      {...(reduce ? {} : { style: { x: sx, y: sy } })}
      onMouseMove={(e) => {
        if (reduce) return;
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set(((e.clientX - (r.left + r.width / 2)) / r.width) * strength * 2);
        y.set(((e.clientY - (r.top + r.height / 2)) / r.height) * strength * 2);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/** Crossfade + slide for route changes. Keyed by pathname in the layout. */
export function PageTransition({ children, pathname }: { children: ReactNode; pathname: string }) {
  const reduce = useReducedMotion();
  // A new page always starts at the top (unless a #hash asked for a section). The router's
  // own restoration is kept for back/forward, but it was leaving us mid-page on fresh clicks.
  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash) return;
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return (
    <motion.div
      key={pathname}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** A thin bar across the top while the next page is loading, so a click never looks ignored. */
export function RouteProgress() {
  const pending = useRouterState({ select: (s) => s.status === "pending" });
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!pending) {
      setShow(false);
      return;
    }
    // Only for loads that take a moment; quick ones (preloaded pages) show nothing.
    const t = window.setTimeout(() => setShow(true), 120);
    return () => window.clearTimeout(t);
  }, [pending]);
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px] overflow-hidden"
    >
      {show && (
        <motion.div
          className="h-full bg-ink"
          initial={{ width: "0%" }}
          animate={{ width: "85%" }}
          transition={{ duration: 2.5, ease: [0.1, 0.6, 0.2, 1] }}
        />
      )}
    </div>
  );
}

/** Counts up to a number when it enters view. */
// Counters that have already played, so a number only counts up the first time it is seen
// (survives re-renders and remounts caused by data refetches or route transitions).
const playedCounters = new Set<string>();

export function CountUp({
  id,
  value,
  format,
}: {
  id?: string;
  value: number;
  format: (n: number) => string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const key = id ?? `v:${value}`;
  const played = useRef(playedCounters.has(key));
  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      onViewportEnter={() => {
        const el = ref.current;
        if (!el || played.current) return;
        played.current = true;
        playedCounters.add(key);
        if (reduce) {
          el.textContent = format(value);
          return;
        }
        const start = performance.now();
        const dur = 1100;
        const step = (t: number) => {
          const p = Math.min(1, (t - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = format(Math.round(value * eased));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }}
    >
      {format(value)}
    </motion.span>
  );
}

/**
 * Words slide up out of a mask, one after another, the first time the line scrolls into view.
 * Use for headings; keep `text` short so the stagger stays under a second.
 */
export function SplitReveal({
  text,
  className,
  as: Tag = "span",
  delay = 0,
  serif,
}: {
  text: string;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  delay?: number;
  /** Words (without punctuation) to set in the serif note. */
  serif?: string[];
}) {
  const reduce = useReducedMotion();
  const words = text.split(/\s+/).filter(Boolean);
  const Comp = motion[Tag];
  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.06, delayChildren: delay } },
      }}
      aria-label={text}
    >
      {words.map((w, i) => {
        const bare = w.replace(/[.,!?;:]+$/, "");
        const isSerif = serif?.includes(bare);
        return (
          <Fragment key={i}>
            <span
              className="inline-block overflow-hidden pb-[0.08em] align-bottom"
              aria-hidden="true"
            >
              <motion.span
                className={cn("inline-block", isSerif && "serif-note pr-[0.04em]")}
                variants={{
                  hidden: reduce ? { opacity: 0 } : { y: "110%", opacity: 0 },
                  show: {
                    y: 0,
                    opacity: 1,
                    transition: { duration: 0.7, ease: EASE },
                  },
                }}
              >
                {w}
              </motion.span>
            </span>
            {i < words.length - 1 ? " " : ""}
          </Fragment>
        );
      })}
    </Comp>
  );
}

/** Letters arrive one by one, unblurring — for a single short word that deserves attention. */
export function LetterReveal({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className={cn("inline-block", className)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.05, delayChildren: delay } },
      }}
      aria-label={text}
    >
      {Array.from(text).map((ch, i) => (
        <motion.span
          key={i}
          className="inline-block"
          aria-hidden="true"
          variants={{
            hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 14, filter: "blur(8px)" },
            show: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: { duration: 0.6, ease: EASE },
            },
          }}
        >
          {ch}
        </motion.span>
      ))}
    </motion.span>
  );
}

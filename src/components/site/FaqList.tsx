import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Plus } from "lucide-react";
import { useId, useState } from "react";

import type { Faq } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Accordion of questions; one open at a time, the first open by default. */
export function FaqList({ faqs, className }: { faqs: Faq[]; className?: string }) {
  const [open, setOpen] = useState<string | null>(faqs[0]?.id ?? null);
  const reduce = useReducedMotion();
  const base = useId();
  return (
    <ul className={cn("rows border-y border-line", className)}>
      {faqs.map((f) => {
        const isOpen = open === f.id;
        const panelId = `${base}-${f.id}`;
        return (
          <li key={f.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-6 py-5 text-left"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? null : f.id)}
            >
              <span className="font-display text-lg font-medium text-ink md:text-xl">
                {f.question}
              </span>
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-ink transition-transform duration-300",
                  isOpen && "rotate-45 bg-ink text-paper",
                )}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  key="panel"
                  initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-2xl pb-6 text-[16px] leading-relaxed text-graphite">
                    {f.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}

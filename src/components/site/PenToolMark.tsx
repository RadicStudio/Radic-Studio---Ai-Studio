import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useEffect, useRef } from "react";

/**
 * The Radic pen-tool motif: a Bézier arc with two handles and a nib.
 * Draws itself in on mount, then the handle dots lean toward the cursor.
 */
export function PenToolMark({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 14, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 60, damping: 14, mass: 0.6 });
  const leftX = useTransform(sx, (v) => v * 18);
  const leftY = useTransform(sy, (v) => v * 18);
  const rightX = useTransform(sx, (v) => v * 24);
  const rightY = useTransform(sy, (v) => v * 24);

  useEffect(() => {
    if (reduce) return;
    const isTouch = window.matchMedia("(hover: none)").matches;
    if (isTouch) {
      let t = 0;
      let raf = 0;
      const tick = () => {
        t += 0.012;
        mx.set(Math.sin(t) * 0.6);
        my.set(Math.cos(t * 0.8) * 0.5);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }
    const onMove = (e: MouseEvent) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      mx.set(Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth / 2))));
      my.set(Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2))));
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my, reduce]);

  const draw = (delay: number, dur = 0.9) =>
    reduce
      ? {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.4, delay: delay * 0.3 },
        }
      : {
          initial: { pathLength: 0, opacity: 0 },
          animate: { pathLength: 1, opacity: 1 },
          transition: {
            pathLength: { duration: dur, delay, ease: [0.22, 1, 0.36, 1] },
            opacity: { duration: 0.2, delay },
          },
        };

  const pop = (delay: number) => ({
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { type: "spring" as const, stiffness: 260, damping: 18, delay },
  });

  return (
    <svg
      ref={ref}
      viewBox="0 0 420 360"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* The curve */}
      <motion.path
        d="M 70 318 C 96 160, 212 58, 356 112 C 372 118, 382 128, 386 142"
        {...draw(0.1, 1.4)}
      />
      {/* Handles */}
      <motion.path d="M 222 94 L 108 150" {...draw(0.9, 0.5)} />
      <motion.path d="M 222 94 L 362 46" {...draw(0.9, 0.5)} />
      {/* Anchor square */}
      <motion.rect
        x="206"
        y="78"
        width="32"
        height="32"
        rx="2"
        transform="rotate(-20 222 94)"
        fill="currentColor"
        stroke="none"
        {...pop(1.2)}
      />
      {/* Handle dots (parallax) */}
      <motion.g style={{ x: leftX, y: leftY }}>
        <motion.circle cx="108" cy="150" r="13" fill="currentColor" stroke="none" {...pop(1.3)} />
      </motion.g>
      <motion.g style={{ x: rightX, y: rightY }}>
        <motion.circle cx="362" cy="46" r="13" fill="currentColor" stroke="none" {...pop(1.35)} />
      </motion.g>
      {/* End squares */}
      <motion.rect
        x="54"
        y="302"
        width="32"
        height="32"
        rx="2"
        transform="rotate(-20 70 318)"
        fill="currentColor"
        stroke="none"
        {...pop(1.45)}
      />
      <motion.rect
        x="370"
        y="126"
        width="32"
        height="32"
        rx="2"
        transform="rotate(-20 386 142)"
        fill="currentColor"
        stroke="none"
        {...pop(1.5)}
      />
      {/* Nib */}
      <motion.path
        d="M 206 128 L 292 226 L 266 300 L 204 300 L 172 226 Z"
        fill="currentColor"
        stroke="none"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d="M 206 128 L 236 232"
        stroke="var(--paper)"
        strokeWidth="5"
        {...draw(1.7, 0.5)}
      />
      <motion.circle cx="236" cy="236" r="12" fill="var(--paper)" stroke="none" {...pop(1.95)} />
      <motion.rect
        x="196"
        y="312"
        width="80"
        height="22"
        rx="3"
        fill="currentColor"
        stroke="none"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.7 }}
      />
    </svg>
  );
}

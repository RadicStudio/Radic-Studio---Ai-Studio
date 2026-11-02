import { Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { nextBriefTurn, type BriefResult } from "@/lib/ai";
import { cn } from "@/lib/utils";

type Turn = { role: "user" | "assistant"; text: string };

const STARTERS = [
  "A website or app for my business",
  "A logo and brand identity",
  "Tickets and a banner for an event",
  "Instagram content for my brand",
];

/**
 * Smart brief: a short guided chat that turns a rough idea into a structured brief,
 * which the visitor can drop straight into the contact form.
 */
export function SmartBrief({ onUseBrief }: { onUseBrief: (brief: string, pkg: string) => void }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<BriefResult, { done: true }> | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [turns, busy]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;
    const next = [...turns, { role: "user" as const, text: clean }];
    setTurns(next);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const out = await nextBriefTurn(next);
      setTurns([...next, { role: "assistant", text: out.message }]);
      if (out.done) setResult(out);
    } catch (e) {
      setError((e as Error).message || "Something went wrong. You can still use the form below.");
    } finally {
      setBusy(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="panel p-5 md:p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper text-signal">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="font-display text-base font-medium text-ink">Not sure what to write?</p>
          <p className="mt-0.5 text-xs leading-relaxed text-graphite">
            Describe the idea in a sentence. Our assistant asks a few quick questions — sizes,
            quantities, audience, what you already have — and writes the brief for you.
          </p>
        </div>
      </div>

      {turns.length === 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full bg-paper px-3.5 py-1.5 text-sm text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {turns.length > 0 && (
        <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {turns.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex", t.role === "user" ? "justify-end" : "justify-start")}
              >
                <p
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                    t.role === "user" ? "bg-ink text-paper" : "bg-paper text-ink",
                  )}
                >
                  {t.text}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
          {busy && (
            <div className="flex justify-start">
              <p className="rounded-2xl bg-paper px-3.5 py-2 text-sm text-graphite">
                <span className="inline-block animate-pulse">Thinking…</span>
              </p>
            </div>
          )}
          <div ref={bottom} />
        </div>
      )}

      {error && <p className="mt-3 text-sm text-signal">{error}</p>}

      {result ? (
        <div className="mt-4 rounded-2xl bg-paper p-4">
          <p className="text-sm text-signal">Your brief</p>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">
            {result.brief}
          </pre>
          <p className="mt-3 text-sm text-graphite">
            Suggested package: <span className="font-semibold text-ink">{result.package}</span> —{" "}
            {result.package_reason}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onUseBrief(result.brief, result.package)}
              className="font-display rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink/85"
            >
              Use this brief in the form
            </button>
            <button
              type="button"
              onClick={() => {
                setTurns([]);
                setResult(null);
              }}
              className="font-display rounded-full bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:bg-mist"
            >
              Start over
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              turns.length ? "Type your answer…" : "e.g. I need a flyer for my November party"
            }
            className="min-w-0 flex-1 rounded-full border border-transparent bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/40"
            maxLength={600}
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="font-display rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-paper disabled:opacity-40"
          >
            Send
          </button>
        </form>
      )}
      <p className="mt-3 text-[11px] text-graphite">
        AI-assisted intake. Nothing is sent to us until you submit the form.
      </p>
    </div>
  );
}

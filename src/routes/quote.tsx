import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Check, Pencil } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { LucideIcon } from "@/components/site/Bits";
import { FaqList } from "@/components/site/FaqList";
import { WhatsAppGlyph } from "@/components/site/SocialIcon";
import { servicePrice } from "@/components/site/ServiceCard";
import { track } from "@/lib/analytics";
import { formatPrice, whatsappLink } from "@/lib/format";
import { fetchFaqs, fetchServices } from "@/lib/queries";
import {
  ASSETS,
  BRANCHES,
  BUDGETS,
  STYLES,
  TIMELINES,
  budgetNote,
  estimate,
  labelOf,
  type Answers,
  type Option,
} from "@/lib/quote";
import { useSiteShell } from "@/lib/site";
import { getSupabase } from "@/lib/supabase";
import type { Service } from "@/lib/types";
import { cn } from "@/lib/utils";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/quote")({
  validateSearch: (search: Record<string, unknown>): { service?: string } =>
    typeof search["service"] === "string" ? { service: search["service"] } : {},
  loader: async () => {
    const [services, faqs] = await Promise.all([fetchServices(), fetchFaqs()]);
    return { services, faqs };
  },
  staleTime: 60_000,
  head: () =>
    seo(
      "/quote",
      "Design Price Calculator Nigeria — Get a Price Range | Radic Studio",
      "Six quick taps, no typing: see a price range for your logo, flyer, social media, print or app design in Nigeria before you talk to anyone.",
    ),
  component: QuotePage,
});

const STEPS = ["What you need", "The project", "What you have", "When", "Budget", "Style"] as const;
const EASE = [0.22, 1, 0.36, 1] as const;

function QuotePage() {
  const { services, faqs } = Route.useLoaderData();
  const { service: preselected } = Route.useSearch();
  const { settings } = useSiteShell();
  const reduce = useReducedMotion();

  const initial: Answers = services.some((s) => s.id === preselected)
    ? { serviceId: preselected }
    : {};
  const [a, setA] = useState<Answers>(initial);
  const [step, setStep] = useState<number>(initial.serviceId ? 1 : 0);
  const [dir, setDir] = useState(1);

  const service = services.find((s) => s.id === a.serviceId);
  const branch = service ? BRANCHES[service.kind] : undefined;
  const est = useMemo(() => estimate(service, a), [service, a]);
  const done = step >= STEPS.length;

  function go(to: number) {
    setDir(to > step ? 1 : -1);
    setStep(to);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function pick(patch: Answers) {
    setA((prev) => {
      const next = { ...prev, ...patch };
      // a new service invalidates the branch answer
      if (patch.serviceId && patch.serviceId !== prev.serviceId) next.branch = undefined;
      return next;
    });
    setTimeout(() => go(step + 1), reduce ? 0 : 180);
  }

  return (
    <section className="pt-[104px] pb-24 md:pt-[136px]">
      <div className="container-site max-w-3xl">
        {!done && (
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4 text-sm text-graphite">
              <button
                type="button"
                onClick={() => (step > 0 ? go(step - 1) : history.back())}
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition-colors hover:bg-surface hover:text-ink"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <span>
                Step {step + 1} of {STEPS.length} · {STEPS[step]}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface" aria-hidden="true">
              <motion.div
                className="h-full rounded-full bg-ink"
                initial={false}
                animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.5, ease: EASE }}
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            {step === 0 && (
              <Question
                title="What do you need?"
                sub="Pick the closest one. You can add more later."
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {services.map((s) => (
                    <ServiceOption
                      key={s.id}
                      service={s}
                      selected={a.serviceId === s.id}
                      onClick={() => pick({ serviceId: s.id })}
                    />
                  ))}
                  <Link
                    to="/contact"
                    className="flex items-center justify-between gap-4 rounded-2xl border border-dashed border-line p-5 text-left text-graphite transition-colors hover:border-ink/40 hover:text-ink"
                  >
                    <span>
                      <span className="block font-medium text-ink">Not sure</span>
                      <span className="text-sm">Describe it in a sentence instead</span>
                    </span>
                  </Link>
                </div>
              </Question>
            )}

            {step === 1 && branch && (
              <Question title={branch.question}>
                <Options
                  options={branch.options}
                  value={a.branch}
                  onPick={(id) => pick({ branch: id })}
                />
              </Question>
            )}

            {step === 2 && (
              <Question title="What do you already have?" sub="So we price the real scope.">
                <Options options={ASSETS} value={a.assets} onPick={(id) => pick({ assets: id })} />
              </Question>
            )}

            {step === 3 && (
              <Question title="When do you need it?">
                <Options
                  options={TIMELINES}
                  value={a.timeline}
                  onPick={(id) => pick({ timeline: id })}
                />
              </Question>
            )}

            {step === 4 && (
              <Question
                title="Roughly what budget?"
                sub="It only helps us suggest the right version."
              >
                <Options options={BUDGETS} value={a.budget} onPick={(id) => pick({ budget: id })} />
              </Question>
            )}

            {step === 5 && (
              <Question title="Which of these feels closest?" sub="Optional. It’s our own work.">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {STYLES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => pick({ style: st.id })}
                      className={cn(
                        "group relative overflow-hidden rounded-2xl bg-surface text-left outline-offset-2 transition-transform duration-300 hover:-translate-y-0.5",
                        a.style === st.id && "outline outline-[3px] outline-ink",
                      )}
                    >
                      <img
                        src={st.image}
                        alt=""
                        className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                      <span className="absolute inset-x-2 bottom-2 rounded-full bg-paper/90 px-3 py-1.5 text-center text-sm font-medium text-ink backdrop-blur">
                        {st.label}
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => pick({ style: undefined })}
                  className="mt-4 w-full rounded-full bg-surface px-5 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-mist"
                >
                  Skip, surprise me
                </button>
              </Question>
            )}

            {done && service && (
              <Result
                service={service}
                answers={a}
                estimateText={est.text}
                personal={est.kind === "personal"}
                note={budgetNote(est, a.budget)}
                onEdit={(s) => go(s)}
                whatsapp={settings.whatsapp_number}
                studio={settings.studio_name}
                replyPromise={settings.reply_promise}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {faqs.length > 0 && (
          <div className="mt-20">
            <p className="mb-2 text-sm text-graphite">Common questions</p>
            <FaqList faqs={faqs.slice(0, 4)} />
          </div>
        )}
      </div>
    </section>
  );
}

function Question({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div>
      <h1 className="display-wide text-[34px] text-ink sm:text-5xl">{title}</h1>
      {sub && <p className="mt-3 text-[17px] text-graphite">{sub}</p>}
      <div className="mt-8">{children}</div>
    </div>
  );
}

function Options({
  options,
  value,
  onPick,
}: {
  options: Option[];
  value: string | undefined;
  onPick: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((o) => {
        const on = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onPick(o.id)}
            aria-pressed={on}
            className={cn(
              "flex min-h-[72px] items-center justify-between gap-4 rounded-2xl p-5 text-left transition-[background-color,transform,color] duration-200 active:scale-[0.98]",
              on ? "bg-ink text-paper" : "bg-surface text-ink hover:bg-mist",
            )}
          >
            <span>
              <span className="block text-[16px] font-medium">{o.label}</span>
              {o.hint && (
                <span className={cn("text-sm", on ? "text-paper/70" : "text-graphite")}>
                  {o.hint}
                </span>
              )}
            </span>
            {on && <Check className="h-5 w-5 shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

function ServiceOption({
  service: s,
  selected,
  onClick,
}: {
  service: Service;
  selected: boolean;
  onClick: () => void;
}) {
  const price = servicePrice(s);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex items-center gap-4 rounded-2xl p-5 text-left transition-[background-color,transform] duration-200 active:scale-[0.98]",
        selected ? "bg-ink text-paper" : "bg-surface text-ink hover:bg-mist",
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
          selected ? "bg-paper/15" : "bg-paper",
        )}
      >
        <LucideIcon name={s.icon} className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-[16px] font-medium">{s.title}</span>
        <span className={cn("text-sm", selected ? "text-paper/70" : "text-graphite")}>
          {price.lead
            ? `${price.lead} ${price.amount}${price.note ? ` ${price.note}` : ""}`
            : price.amount}
        </span>
      </span>
    </button>
  );
}

function Result({
  service,
  answers: a,
  estimateText,
  personal,
  note,
  onEdit,
  whatsapp,
  studio,
  replyPromise,
}: {
  service: Service;
  answers: Answers;
  estimateText: string;
  personal: boolean;
  note: string | null;
  onEdit: (step: number) => void;
  whatsapp: string | null;
  studio: string;
  replyPromise: string | null;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"choose" | "email" | "sent">("choose");
  const [sending, setSending] = useState(false);
  const reduce = useReducedMotion();

  const branch = BRANCHES[service.kind];
  const rows: { label: string; value: string; step: number }[] = [
    { label: "Service", value: service.title, step: 0 },
    { label: "Project", value: labelOf(branch.options, a.branch) ?? "—", step: 1 },
    { label: "You have", value: labelOf(ASSETS, a.assets) ?? "—", step: 2 },
    { label: "When", value: labelOf(TIMELINES, a.timeline) ?? "—", step: 3 },
    { label: "Budget", value: labelOf(BUDGETS, a.budget) ?? "—", step: 4 },
    {
      label: "Style",
      value: STYLES.find((s) => s.id === a.style)?.label ?? "Surprise me",
      step: 5,
    },
  ];
  const brief = Object.fromEntries([
    ...rows.map((r) => [r.label, r.value]),
    ["Estimate", estimateText],
  ]) as Record<string, string>;

  const includes = [
    service.concepts
      ? `${service.concepts} design direction${service.concepts === 1 ? "" : "s"}`
      : null,
    service.revisions ? `${service.revisions} rounds of revisions` : null,
    "print-ready and editable files",
    "full rights in writing",
  ].filter(Boolean) as string[];

  const message = [
    `Hi ${studio}, I'd like a price for:`,
    ...rows.map((r) => `• ${r.label}: ${r.value}`),
    personal ? "" : `Your website estimate: ${estimateText}.`,
    name.trim() ? `— ${name.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  function log(source: "quote-whatsapp" | "quote-email", id: string = crypto.randomUUID()) {
    track("quote_complete", {
      service: service?.title,
      budget: brief["Budget"],
      method: source === "quote-whatsapp" ? "whatsapp" : "email",
    });
    return getSupabase()
      .from("inquiries")
      .insert({
        id,
        name: name.trim().slice(0, 120) || "Website visitor",
        email: email.trim().slice(0, 200),
        budget_range: labelOf(BUDGETS, a.budget) ?? null,
        message,
        source,
        brief,
      });
  }

  async function sendEmail() {
    if (!email.trim()) return;
    setSending(true);
    const id = crypto.randomUUID();
    const { error } = await log("quote-email", id);
    setSending(false);
    if (error) return;
    getSupabase()
      .functions.invoke("notify-inquiry", { body: { id } })
      .catch(() => undefined);
    setMode("sent");
  }

  return (
    <div>
      <p className="text-sm text-graphite">Your estimate</p>
      <motion.h1
        className="display-wide mt-2 text-[40px] text-ink sm:text-6xl"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        {personal ? "We’ll price this one personally." : estimateText}
      </motion.h1>
      <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-graphite">
        {personal
          ? `${service.title} varies a lot by brief. Send it over and we’ll come back with a range.`
          : `Projects like this usually land here${service.turnaround ? ` and take ${service.turnaround.toLowerCase()}` : ""}. Includes ${includes.join(", ")}.`}
        {a.timeline === "rush" && " Rush pricing is included."}
      </p>
      {note && <p className="mt-3 rounded-2xl bg-surface px-4 py-3 text-[15px] text-ink">{note}</p>}

      <dl className="mt-8 rows rounded-3xl bg-surface px-5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 py-3.5">
            <dt className="text-sm text-graphite">{r.label}</dt>
            <dd className="flex items-center gap-2 text-right text-[15px] font-medium text-ink">
              {r.value}
              <button
                type="button"
                onClick={() => onEdit(r.step)}
                className="rounded-full p-1.5 text-graphite transition-colors hover:bg-paper hover:text-ink"
                aria-label={`Change ${r.label.toLowerCase()}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </dd>
          </div>
        ))}
      </dl>

      {mode !== "sent" && (
        <div className="mt-8 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-sm text-graphite">Your name (optional)</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="w-full rounded-2xl border border-transparent bg-surface px-4 py-3.5 text-[16px] text-ink outline-none focus:border-ink/40"
            />
          </label>
          <a
            href={whatsappLink(whatsapp, message)}
            target="_blank"
            rel="noreferrer noopener"
            onClick={() => {
              void log("quote-whatsapp");
            }}
            className="font-display flex w-full items-center justify-center gap-2.5 rounded-full bg-ink px-6 py-4 text-[16px] font-semibold text-paper transition-[background-color,transform] hover:bg-ink/85 active:scale-[0.98]"
          >
            <WhatsAppGlyph className="h-5 w-5" aria-hidden="true" />
            Send this brief on WhatsApp
          </a>
          {mode === "choose" ? (
            <button
              type="button"
              onClick={() => setMode("email")}
              className="w-full rounded-full bg-surface px-6 py-3.5 text-[15px] font-medium text-ink transition-colors hover:bg-mist"
            >
              Send by email instead
            </button>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="min-w-0 flex-1 rounded-full border border-transparent bg-surface px-5 py-3.5 text-[16px] text-ink outline-none focus:border-ink/40"
              />
              <button
                type="button"
                disabled={sending || !email.trim()}
                onClick={sendEmail}
                className="rounded-full bg-ink px-6 py-3.5 text-[15px] font-semibold text-paper disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          )}
          {replyPromise && <p className="pt-1 text-center text-sm text-graphite">{replyPromise}</p>}
        </div>
      )}

      {mode === "sent" && (
        <div className="mt-8 rounded-3xl bg-ink p-6 text-paper">
          <p className="font-display text-xl font-semibold">Got it. Your brief is with us.</p>
          <p className="mt-2 text-paper/70">
            We’ll reply to {email} with a fixed price. Faster? Message us on WhatsApp.
          </p>
        </div>
      )}

      <p className="mt-6 text-xs leading-relaxed text-graphite">
        This is an estimate from typical projects, not a quote. You get a fixed price in writing
        before any work starts, with a 50% deposit to begin.
        {!personal && service.price_from != null && (
          <>
            {" "}
            Prices for {service.title.toLowerCase()} start{" "}
            {formatPrice(Number(service.price_from), "₦")}.
          </>
        )}
      </p>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState, type FormEvent } from "react";

import { ButtonA, SectionHeading } from "@/components/site/Bits";
import { SocialRow } from "@/components/site/SocialIcon";
import { Reveal } from "@/components/site/motion";
import { SmartBrief } from "@/components/site/SmartBrief";
import { track } from "@/lib/analytics";
import { whatsappLink } from "@/lib/format";
import { useSiteShell } from "@/lib/site";
import { getSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () =>
    seo(
      "/contact",
      "Contact a Graphic Designer in Enugu — Radic Studio",
      "Tell Radic Studio about your logo, flyer, social media or app design. We reply within the hour on WhatsApp, Monday to Saturday, 9am to 7pm.",
    ),
  component: Contact,
});

const PACKAGE_BUDGET: Record<string, string> = {
  Starter: "Under ₦150k",
  Studio: "₦150k – ₦350k",
  Partner: "₦350k – ₦800k",
};

const BUDGETS = ["Under ₦150k", "₦150k – ₦350k", "₦350k – ₦800k", "₦800k+", "Not sure yet"];

function Contact() {
  const { settings, socials } = useSiteShell();
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [form, setForm] = useState({ name: "", email: "", budget_range: "", message: "" });
  const [problem, setProblem] = useState("");
  // Spam traps: a hidden field people never see, and a minimum time on the page.
  const [trap, setTrap] = useState("");
  const openedAt = useRef(Date.now());

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProblem("");
    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();
    if (!name || name.length > 120)
      return setProblem("Please add your name (up to 120 characters).");
    if (!/^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]{2,}$/.test(email))
      return setProblem("Please check your email address.");
    if (!message || message.length > 5000)
      return setProblem("Please describe the project (up to 5,000 characters).");
    if (trap || Date.now() - openedAt.current < 2500) {
      setState("done"); // looks sent to a bot, nothing is saved
      return;
    }
    setState("sending");
    const sb = getSupabase();
    const id = crypto.randomUUID();
    const { error } = await sb.from("inquiries").insert({
      id,
      name,
      email,
      budget_range: form.budget_range || null,
      message,
    });
    if (error) {
      setState("error");
      return;
    }
    track("contact_submit", { budget: form.budget_range || undefined });
    // Email notification is best-effort; the server only emails for a real saved inquiry.
    sb.functions.invoke("notify-inquiry", { body: { id } }).catch(() => undefined);
    setState("done");
  }

  const wa = whatsappLink(
    settings.whatsapp_number,
    `Hi ${settings.studio_name}, I'd like to talk about a project.`,
  );

  return (
    <section className="section pt-[120px] md:pt-[160px]">
      <div className="container-site grid gap-14 md:grid-cols-12">
        <Reveal className="md:col-span-5">
          <SectionHeading
            h1="Contact Radic Studio, graphic designers in Enugu"
            title="Say hello."
            text="Tell us what you're making. A sentence is enough to start."
          />
          <ul className="mt-10 space-y-5 text-[15px]">
            {settings.email && (
              <li>
                <p className="text-sm text-graphite">Email</p>
                <a
                  href={`mailto:${settings.email}`}
                  className="link-draw font-display mt-1 inline-block text-lg font-medium text-ink"
                >
                  {settings.email}
                </a>
              </li>
            )}
            {settings.phone && (
              <li>
                <p className="text-sm text-graphite">Phone / WhatsApp</p>
                <a
                  href={`tel:${settings.phone}`}
                  className="link-draw font-display mt-1 inline-block text-lg font-medium text-ink"
                >
                  {settings.phone}
                </a>
              </li>
            )}
            {settings.address && (
              <li>
                <p className="text-sm text-graphite">Studio</p>
                <p className="mt-1 text-ink">{settings.address}</p>
              </li>
            )}
          </ul>
          <div className="mt-8">
            <ButtonA href={wa}>Chat on WhatsApp</ButtonA>
          </div>
          {settings.reply_promise && (
            <p className="mt-4 text-sm text-graphite">{settings.reply_promise}</p>
          )}
          <SocialRow links={socials} className="mt-8" />
        </Reveal>

        <Reveal className="space-y-5 md:col-span-7" delay={0.1}>
          {state !== "done" && (
            <Link
              to="/quote"
              className="group flex items-center justify-between gap-4 rounded-3xl bg-ink p-6 text-paper transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 md:p-7"
            >
              <span>
                <span className="block text-sm text-paper/60">Fastest</span>
                <span className="font-display mt-1 block text-xl font-semibold">
                  Get a price range in six taps. No typing.
                </span>
              </span>
              <ArrowUpRight className="h-6 w-6 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          )}
          {state !== "done" && (
            <SmartBrief
              onUseBrief={(brief, pkg) => {
                setForm((f) => ({
                  ...f,
                  message: brief,
                  budget_range: f.budget_range || PACKAGE_BUDGET[pkg] || "",
                }));
                document
                  .getElementById("tell-us-about-the-project")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            />
          )}
          <div className="panel p-6 md:p-10">
            {state === "done" ? (
              <div className="flex flex-col items-center py-10 text-center">
                <svg
                  viewBox="0 0 64 64"
                  className="h-20 w-20 text-ink"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="28"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                  <motion.path
                    d="M20 33 L29 42 L45 24"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.45, delay: 0.5, ease: "easeOut" }}
                  />
                </svg>
                <h2 className="display-wide mt-6 text-3xl text-ink">
                  Got it, {form.name.split(" ")[0] || "thanks"}.
                </h2>
                <p className="mt-2 max-w-sm text-graphite">
                  We'll reply by email soon. Want a faster answer? Continue on WhatsApp.
                </p>
                <div className="mt-6">
                  <ButtonA
                    href={whatsappLink(
                      settings.whatsapp_number,
                      `Hi, I'm ${form.name}. I just sent a message through your website.`,
                    )}
                  >
                    Open WhatsApp
                  </ButtonA>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="relative space-y-5" noValidate={false}>
                <Field
                  label="Your name"
                  value={form.name}
                  onChange={(v) => setForm({ ...form, name: v })}
                  required
                  autoComplete="name"
                />
                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(v) => setForm({ ...form, email: v })}
                  required
                  autoComplete="email"
                />
                <div className="relative">
                  <label htmlFor="budget" className="mb-2 block text-sm text-graphite">
                    Budget range
                  </label>
                  <select
                    id="budget"
                    value={form.budget_range}
                    onChange={(e) => setForm({ ...form, budget_range: e.target.value })}
                    className="w-full rounded-2xl border border-transparent bg-paper px-4 py-3.5 text-[15px] text-ink outline-none focus:border-ink/40"
                  >
                    <option value="">Choose one (optional)</option>
                    {BUDGETS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <Field
                  label="Tell us about the project"
                  value={form.message}
                  onChange={(v) => setForm({ ...form, message: v })}
                  required
                  textarea
                />
                {/* Hidden from people; bots fill it in. */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={trap}
                    onChange={(e) => setTrap(e.target.value)}
                  />
                </div>
                {problem && <p className="text-sm text-ink">{problem}</p>}
                {state === "error" && (
                  <p className="text-sm text-ink">
                    Something went wrong. Please try again, or message us on WhatsApp.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={state === "sending"}
                  className="font-display w-full rounded-full bg-ink px-6 py-3.5 text-[15px] font-semibold text-paper transition-colors hover:bg-ink/85 disabled:opacity-60"
                >
                  {state === "sending" ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  textarea,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  autoComplete?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  const base =
    "peer w-full rounded-2xl border border-transparent bg-paper px-4 pt-6 pb-2.5 text-[15px] text-ink outline-none placeholder-transparent focus:border-ink/40";
  return (
    <div className="relative">
      {textarea ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          maxLength={5000}
          rows={5}
          placeholder={label}
          className={cn(base, "resize-y")}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          maxLength={type === "email" ? 200 : 120}
          placeholder={label}
          autoComplete={autoComplete}
          className={base}
        />
      )}
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-4 top-2 text-[11px] font-medium tracking-wide text-graphite transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-[11px] peer-focus:font-medium peer-focus:text-ink"
      >
        {label}
      </label>
    </div>
  );
}

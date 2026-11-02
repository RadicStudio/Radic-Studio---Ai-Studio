import { createFileRoute } from "@tanstack/react-router";

import { SectionHeading } from "@/components/site/Bits";
import { CookieSettingsLink } from "@/components/site/Consent";
import { useSiteShell } from "@/lib/site";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy policy — Radic Studio" },
      {
        name: "description",
        content:
          "What Radic Studio collects when you visit the site, ask for a quote or sign one, why, who sees it, and how to have it changed or deleted.",
      },
    ],
  }),
  component: Privacy,
});

const UPDATED = "1 November 2026";

function sections(email: string): { title: string; items: string[] }[] {
  return [
    {
      title: "1. Who we are",
      items: [
        "Radic Studio is a design studio in Enugu, Nigeria, run by Collins Onuora Odoh. We decide how the information on this website is used, so under the Nigeria Data Protection Act 2023 we are its data controller.",
        `For anything about your information, email ${email} or message us on WhatsApp. We reply within 3 working days.`,
      ],
    },
    {
      title: "2. What we collect",
      items: [
        "When you ask for a price or send a message: your name, email, WhatsApp number if you message us there, and what you tell us about your project, budget and timeline.",
        "When you sign a quote: your name, email, your typed or drawn signature, the date and time, your internet (IP) address and the type of device and browser you used. This proves the agreement was signed.",
        "When you pay: we see the payment confirmation or receipt you send. We never see or store your card details.",
        "When you browse, only if you click Accept on the cookie notice: which pages you visit, which ad or link brought you here, and whether you asked for a price or tapped WhatsApp. This comes from Google Analytics and the Meta Pixel. If you click No thanks, neither loads.",
      ],
    },
    {
      title: "3. Why we use it",
      items: [
        "To reply to you, prepare your quote and do the work you hire us for. This is needed to make and carry out our agreement with you.",
        "To keep a record of signed quotes, payments and ownership certificates, as the law and our client terms require.",
        "To see which pages and ads work, so we spend less on the ones that don't. We only do this with your consent, and you can withdraw it any time.",
        "We don't sell your information, and we don't use it to make automated decisions about you.",
      ],
    },
    {
      title: "4. Who else sees it",
      items: [
        "Supabase stores the website's database, including inquiries and quotes. Resend sends our email notifications.",
        "WhatsApp (Meta) carries the messages you send us there.",
        "Google and Meta receive browsing information only if you accept cookies.",
        "These companies may keep information on servers outside Nigeria. We only use providers that protect it with security and contract terms at least as strong as Nigerian law requires.",
        "We'll share information with the authorities only when the law requires it.",
      ],
    },
    {
      title: "5. How long we keep it",
      items: [
        "Inquiries that don't become projects: up to 2 years, then deleted.",
        "Signed quotes, payment records and ownership certificates: 6 years after the project ends, for tax and legal records.",
        "Analytics information is kept by Google and Meta for up to 14 months.",
      ],
    },
    {
      title: "6. Your rights",
      items: [
        "You can ask us for a copy of the information we hold about you, ask us to correct it, or ask us to delete it, unless we have to keep it for legal records.",
        "You can object to how we use it or withdraw your consent to cookies at any time. Use the Cookie settings link at the bottom of any page.",
        "If you're unhappy with how we handle your information, you can complain to the Nigeria Data Protection Commission (ndpc.gov.ng). We'd like the chance to fix it first.",
      ],
    },
    {
      title: "7. Cookies",
      items: [
        "The site always uses a small number of essential cookies and local storage: to remember your cookie choice and, for the studio team, to keep the admin panel signed in.",
        "Analytics and advertising cookies from Google and Meta only load after you click Accept.",
      ],
    },
    {
      title: "8. Keeping it safe and changes",
      items: [
        "Information travels over encrypted connections (https), and only the studio can open inquiries and quotes in the admin panel.",
        "If we change this policy, we'll update the date at the top of this page. Important changes will also be shown on the site.",
      ],
    },
  ];
}

function Privacy() {
  const { settings } = useSiteShell();
  const email = settings.email || "radic.studio@gmail.com";
  return (
    <div className="container-site pt-28 pb-16 md:pt-36">
      <SectionHeading
        eyebrow="Privacy policy"
        title="What we keep, and why."
        text="Plain answers about the information you share with Radic Studio on this website."
      />
      <div className="mt-12 grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="panel h-fit p-6 text-sm leading-relaxed lg:sticky lg:top-28">
          <p className="font-medium text-ink">In one minute</p>
          <ul className="mt-3 space-y-2 text-graphite">
            <li>We use what you send us to reply and do your project.</li>
            <li>Tracking cookies only load if you accept them.</li>
            <li>We never sell your information.</li>
            <li>Ask us any time to see, fix or delete it.</li>
          </ul>
          <CookieSettingsLink className="mt-4 text-xs text-ink underline underline-offset-2" />
          <p className="mt-4 text-xs text-graphite">Last updated {UPDATED}</p>
        </aside>
        <div className="space-y-12">
          {sections(email).map((s) => (
            <section key={s.title}>
              <h2 className="font-display text-xl font-semibold text-ink">{s.title}</h2>
              <ol className="mt-4 space-y-3 text-[15px] leading-relaxed text-ink/85">
                {s.items.map((it, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="font-mono w-5 shrink-0 pt-0.5 text-xs text-graphite">
                      {i + 1}
                    </span>
                    <span>{it}</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

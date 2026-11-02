import { createFileRoute } from "@tanstack/react-router";

import { SectionHeading } from "@/components/site/Bits";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Client terms and rights of use — Radic Studio" },
      {
        name: "description",
        content:
          "How quotes, deposits, changes and ownership work at Radic Studio. After full payment, the final design is yours.",
      },
    ],
  }),
  component: Terms,
});

const SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "1. Quotes, deposits and payment",
    items: [
      "Each job starts with a written quote showing the scope, deliverables, price, timeline and payment schedule. A quote is valid for 14 days from the date on it.",
      "You accept by signing the quote online or by paying the deposit. Either one means you agree to the quote and these terms.",
      "Work starts once the 50% deposit is paid. Jobs under ₦100,000 are paid 100% up front.",
      "The remaining 50% is due when we present the final design for approval. Final files are sent after the balance is paid.",
      "Monthly retainers are paid in full by the 1st of each month. You can pause for a month with 7 days' notice.",
      "Pay by bank transfer to Radic Studio's account or the payment link in your quote. We confirm every payment in writing.",
      "If the balance is unpaid 14 days after the final design is presented, the files stay with us and the timeline is paused. Nothing you haven't paid for may be used.",
      "Printing and third-party costs (printing, stock photos, paid fonts, domains, hosting, ads) are not included unless the quote lists them.",
    ],
  },
  {
    title: "2. Scope, changes and timelines",
    items: [
      "We design what the quote lists. New items, extra sizes or new uses are quoted separately before we start them.",
      "Each job includes 2 rounds of changes on the chosen direction. A round is one combined list of changes sent together. Extra rounds cost the rate in your quote.",
      "Identity jobs include the number of first directions in the quote. You choose one to develop; the others stay with Radic Studio.",
      "Turnaround starts when the deposit is paid and we have your content (text, logos, photos, prices). Each day you take to reply adds a day to the timeline.",
      "Faster than the normal turnaround adds 25–50%, shown in the quote.",
      "You check spelling, phone numbers, prices and dates before approving. Once you approve, mistakes in the approved text are fixed as a paid change.",
      "If we arrange printing, you approve a final proof first. Colours on screen can differ slightly from print.",
    ],
  },
  {
    title: "3. Rights of use",
    items: [
      "Once you've paid in full, Radic Studio transfers to you the copyright in the final approved deliverables listed in your quote. You may use, print, change, register as a trademark and resell them, in any medium, anywhere, with no time limit. The transfer is written into your signed quote and the certificate of ownership you receive with your files.",
      "Until full payment, Radic Studio owns the design and it may not be used, printed or published.",
      "Radic Studio keeps drafts, unused concepts and directions you didn't choose, its working methods, templates and tools, and the right to show the finished work in its portfolio, website and social media once you've made it public.",
      "Fonts, stock photos, icons and mockups from other companies stay under their own licences. We use assets that allow commercial use and list them in your handover note.",
      "Your logo, photos, text and products stay yours. You confirm you have the right to give them to us to use.",
      "Want the work kept out of our portfolio? Add a 20% confidentiality fee and we'll keep it off all public channels.",
    ],
  },
  {
    title: "4. Cancellations, confidentiality and AI",
    items: [
      "You can cancel at any time in writing. The deposit covers work already done and isn't refunded. If you cancel after the final design is presented, the full price is due.",
      "If Radic Studio can't finish the job, we refund the part of your payment we haven't earned and give you any finished work.",
      "If we don't hear from you for 30 days, the job is closed. Restarting is quoted again.",
      "We keep your business information, prices and unreleased plans private and only use them for your job.",
      "We use AI tools to research, explore ideas faster, retouch images and resize finished designs. A designer makes every creative decision and every final file.",
      "Tell us about any problem in writing and we'll answer within 3 working days. These terms follow the laws of Nigeria.",
    ],
  },
  {
    title: "5. Signing electronically",
    items: [
      "You can sign your quote on this website. We record your typed or drawn signature, your name, email, the date and time, and the device you signed from, keep them with your quote and show you a copy.",
      "Signing online is the same as signing on paper. Radic Studio also signs each quote, so the copyright transfer is in writing and signed by both sides.",
    ],
  },
];

function Terms() {
  return (
    <div className="container-site pt-28 pb-16 md:pt-36">
      <SectionHeading
        eyebrow="Client terms"
        title="Pay in full, and the design is yours."
        text="These terms are part of every Radic Studio quote. They're written to be read, not skimmed past."
      />
      <div className="mt-12 grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="panel h-fit p-6 text-sm leading-relaxed lg:sticky lg:top-28">
          <p className="font-medium text-ink">In one minute</p>
          <ul className="mt-3 space-y-2 text-graphite">
            <li>50% to start, 50% before final files.</li>
            <li>2 rounds of changes included.</li>
            <li>The clock starts with the deposit and your content.</li>
            <li>After full payment, you own the final design.</li>
            <li>We may show the work once it's public.</li>
          </ul>
          <p className="mt-4 text-xs text-graphite">Last updated 1 November 2026</p>
        </aside>
        <div className="space-y-12">
          {SECTIONS.map((s) => (
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

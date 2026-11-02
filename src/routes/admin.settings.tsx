import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ImageField, SwitchField, TextAreaField, TextField } from "@/components/admin/Fields";
import { PageHeader } from "@/components/admin/Shell";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase";
import { DEFAULT_SETTINGS, type ProcessStep, type SiteSettings } from "@/lib/types";

export const Route = createFileRoute("/admin/settings")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "site_settings"],
    queryFn: async () => {
      const { data } = await getSupabase()
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      return (data as SiteSettings | null) ?? DEFAULT_SETTINGS;
    },
  });
  const [d, setD] = useState<SiteSettings>(DEFAULT_SETTINGS);
  useEffect(() => {
    if (q.data) setD({ ...q.data, process_steps: q.data.process_steps ?? [] });
  }, [q.data]);
  const set = (patch: Partial<SiteSettings>) => setD((s) => ({ ...s, ...patch }));

  const save = useMutation({
    mutationFn: async () => {
      const { updated_at: _u, ...rest } = d;
      const { error } = await getSupabase()
        .from("site_settings")
        .upsert({ ...rest, id: 1 });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "site_settings"] });
      toast.success("Settings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const steps = d.process_steps ?? [];
  const setStep = (i: number, patch: Partial<ProcessStep>) =>
    set({ process_steps: steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) });

  if (q.isLoading) return <p className="text-sm text-graphite">Loading…</p>;

  return (
    <form
      className="max-w-3xl"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <PageHeader
        title="Site settings"
        text="Text, contact details and SEO used across the site."
        action={
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save settings"}
          </Button>
        }
      />

      <Section title="Studio">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Studio name"
            value={d.studio_name}
            onChange={(v) => set({ studio_name: v })}
          />
          <TextField label="Tagline" value={d.tagline} onChange={(v) => set({ tagline: v })} />
        </div>
      </Section>

      <Section title="Home page hero">
        <TextField
          label="Headline"
          value={d.hero_headline}
          onChange={(v) => set({ hero_headline: v })}
          hint="Wrap one word in *asterisks* to set it in the serif italic, e.g. We draw brands from the *root*."
        />
        <TextAreaField
          label="Sub-line"
          rows={2}
          value={d.hero_subline}
          onChange={(v) => set({ hero_subline: v })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Button text"
            value={d.hero_cta_text}
            onChange={(v) => set({ hero_cta_text: v })}
          />
          <TextField
            label="Button link"
            value={d.hero_cta_url}
            onChange={(v) => set({ hero_cta_url: v })}
            hint="e.g. /quote, /work or /contact"
          />
        </div>
        <TextField
          label="Availability line"
          value={d.availability_text}
          onChange={(v) => set({ availability_text: v || null })}
          hint="Shown above the headline with a live dot, e.g. Taking two new brand projects for December. Leave empty to hide."
        />
        <TextField
          label="Reply promise"
          value={d.reply_promise}
          onChange={(v) => set({ reply_promise: v || null })}
          hint="Shown on the quote and contact pages. Only promise what you can keep."
        />
      </Section>

      <Section title="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Email"
            type="email"
            value={d.email}
            onChange={(v) => set({ email: v })}
          />
          <TextField label="Phone (as shown)" value={d.phone} onChange={(v) => set({ phone: v })} />
          <TextField
            label="WhatsApp number"
            value={d.whatsapp_number}
            onChange={(v) => set({ whatsapp_number: v.replace(/\D/g, "") })}
            hint="International format without +, e.g. 2348133037674"
          />
          <TextField
            label="Address (optional)"
            value={d.address}
            onChange={(v) => set({ address: v })}
          />
        </div>
      </Section>

      <Section title="Payments on quotes">
        <p className="mb-4 text-xs text-graphite">
          Shown to clients after they sign a quote, so they can pay the deposit by transfer.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            label="Bank"
            value={d.bank_name}
            placeholder="e.g. Moniepoint MFB"
            onChange={(v) => set({ bank_name: v || null })}
          />
          <TextField
            label="Account name"
            value={d.bank_account_name}
            onChange={(v) => set({ bank_account_name: v || null })}
          />
          <TextField
            label="Account number"
            value={d.bank_account_number}
            onChange={(v) => set({ bank_account_number: v || null })}
          />
        </div>
      </Section>

      <Section title="Ads and analytics">
        <p className="mb-4 text-xs text-graphite">
          Paste the IDs to start measuring visits, quote requests and WhatsApp taps. Tracking only
          loads for visitors who accept cookies.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Meta Pixel ID"
            value={d.meta_pixel_id}
            placeholder="e.g. 1234567890123456"
            onChange={(v) => set({ meta_pixel_id: v.replace(/\D/g, "") || null })}
          />
          <TextField
            label="Google Analytics measurement ID"
            value={d.ga_measurement_id}
            placeholder="e.g. G-ABC123XYZ9"
            onChange={(v) => set({ ga_measurement_id: v.trim().toUpperCase() || null })}
          />
        </div>
      </Section>

      <Section title="About page">
        <TextAreaField
          label="Studio story"
          rows={5}
          value={d.about_story}
          onChange={(v) => set({ about_story: v })}
        />
        <TextAreaField
          label="How we use AI"
          rows={6}
          value={d.ai_statement}
          onChange={(v) => set({ ai_statement: v || null })}
          hint="Shown on the About page. Say where AI saves time, where a designer decides, and who is accountable."
        />
        <div className="space-y-3">
          <p className="text-xs font-medium tracking-wide text-graphite uppercase">Process steps</p>
          {steps.map((s, i) => (
            <div
              key={i}
              className="grid gap-2 rounded-lg border border-mist bg-white p-3 sm:grid-cols-[1fr_2fr_auto]"
            >
              <input
                value={s.title}
                onChange={(e) => setStep(i, { title: e.target.value })}
                placeholder="Step title"
                className="rounded-md border border-mist px-2 py-1.5 text-sm"
              />
              <input
                value={s.text}
                onChange={(e) => setStep(i, { text: e.target.value })}
                placeholder="One line about it"
                className="rounded-md border border-mist px-2 py-1.5 text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => set({ process_steps: steps.filter((_, j) => j !== i) })}
                aria-label="Remove step"
              >
                <Trash2 />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => set({ process_steps: [...steps, { title: "", text: "" }] })}
          >
            <Plus /> Add step
          </Button>
        </div>
      </Section>

      <Section title="Pricing & footer">
        <SwitchField
          label="Show pricing section"
          checked={d.show_pricing}
          onChange={(v) => set({ show_pricing: v })}
          hint="Hide it while you adjust packages"
        />
        <TextField
          label="Footer note"
          value={d.footer_note}
          onChange={(v) => set({ footer_note: v })}
        />
      </Section>

      <Section title="SEO & sharing">
        <TextField
          label="Page title"
          value={d.seo_title}
          onChange={(v) => set({ seo_title: v })}
          hint="Shown in the browser tab and search results"
        />
        <TextAreaField
          label="Description"
          rows={2}
          value={d.seo_description}
          onChange={(v) => set({ seo_description: v })}
        />
        <ImageField
          label="Share image"
          value={d.og_image_url}
          onChange={(url) => set({ og_image_url: url })}
          folder="site"
          aspect="aspect-[1.91/1] max-w-sm"
          hint="Shown when the site is shared on WhatsApp, X, Facebook. 1200×630 works best."
        />
      </Section>

      <div className="flex justify-end">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 space-y-4 rounded-xl border border-mist bg-paper p-5">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

-- Research rollout: priced services, availability/reply promise, AI statement, FAQ, quote-flow briefs.

-- Services carry their own "from" price and spec line (Behance Services format).
alter table public.services
  add column if not exists kind text not null default 'other',
  add column if not exists price_from numeric,
  add column if not exists price_to numeric,
  add column if not exists price_note text,
  add column if not exists turnaround text,
  add column if not exists concepts int,
  add column if not exists revisions int;

comment on column public.services.kind is
  'Drives the quote-flow branch question: uiux | brand | event | social | print | illustration | motion | other';
comment on column public.services.price_from is 'Public "from" price (₦). Null = quoted per project.';
comment on column public.services.price_to is 'Upper end of a typical project, used for quote-flow estimates.';

-- Site-wide promises and statements.
alter table public.site_settings
  add column if not exists availability_text text,
  add column if not exists reply_promise text,
  add column if not exists ai_statement text;

-- FAQ, managed in /admin.
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  is_visible boolean not null default true
);
alter table public.faqs enable row level security;
drop policy if exists "faqs public read" on public.faqs;
create policy "faqs public read" on public.faqs for select using (is_visible or public.is_admin());
drop policy if exists "faqs admin write" on public.faqs;
create policy "faqs admin write" on public.faqs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Quote-flow answers travel with the inquiry.
alter table public.inquiries
  add column if not exists source text not null default 'contact',
  add column if not exists brief jsonb;

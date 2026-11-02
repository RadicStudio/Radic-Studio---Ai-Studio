-- Radic Studio schema. Applied to the Supabase project on 2026-10-31.
-- Kept here so the database can be recreated from the repo.

-- Admin allowlist and helper
create table if not exists public.admins (
  email text primary key,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category_id uuid references public.categories(id) on delete set null,
  client text,
  year int,
  tools text[] not null default '{}',
  summary text,
  description text,
  cover_url text,
  cover_alt text,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  url text not null,
  alt text,
  caption text,
  sort_order int not null default 0
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon text default 'Sparkles',
  sort_order int not null default 0,
  is_visible boolean not null default true
);

create table if not exists public.pricing_tiers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric,
  currency text not null default '₦',
  period text default 'per project',
  features text[] not null default '{}',
  is_highlighted boolean not null default false,
  is_visible boolean not null default true,
  sort_order int not null default 0
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  author_name text not null,
  author_role text,
  company text,
  avatar_url text,
  sort_order int not null default 0,
  is_visible boolean not null default true
);

create table if not exists public.client_logos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  sort_order int not null default 0,
  is_visible boolean not null default true
);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'other',
  label text,
  url text not null default '',
  sort_order int not null default 0,
  is_visible boolean not null default false
);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  budget_range text,
  message text not null,
  status text not null default 'new' check (status in ('new','read','replied')),
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  studio_name text not null default 'Radic Studio',
  tagline text not null default 'lux . radix . creatio',
  hero_headline text not null default 'We draw brands from the root.',
  hero_subline text default 'Radic Studio is a design practice for brands that want to be remembered: identity, illustration, interfaces and print, drawn with intent.',
  hero_cta_text text default 'See our work',
  hero_cta_url text default '/work',
  email text default 'radic.studio@gmail.com',
  phone text default '08133037674',
  whatsapp_number text default '2348133037674',
  address text,
  about_story text,
  process_steps jsonb not null default '[]'::jsonb,
  footer_note text default 'Designed and built by Radic Studio.',
  seo_title text default 'Radic Studio — Brand, illustration and interface design',
  seo_description text default 'Radic Studio is a design company. lux . radix . creatio — light, root, creation.',
  og_image_url text,
  show_pricing boolean not null default true,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects
for each row execute function public.touch_updated_at();

drop trigger if exists settings_touch on public.site_settings;
create trigger settings_touch before update on public.site_settings
for each row execute function public.touch_updated_at();

alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.services enable row level security;
alter table public.pricing_tiers enable row level security;
alter table public.testimonials enable row level security;
alter table public.client_logos enable row level security;
alter table public.social_links enable row level security;
alter table public.inquiries enable row level security;
alter table public.site_settings enable row level security;

create policy "admins read own list" on public.admins for select to authenticated using (public.is_admin());

create policy "categories public read" on public.categories for select using (true);
create policy "projects public read" on public.projects for select using (is_published or public.is_admin());
create policy "project_images public read" on public.project_images for select
  using (exists (select 1 from public.projects p where p.id = project_id and (p.is_published or public.is_admin())));
create policy "services public read" on public.services for select using (is_visible or public.is_admin());
create policy "pricing public read" on public.pricing_tiers for select using (is_visible or public.is_admin());
create policy "testimonials public read" on public.testimonials for select using (is_visible or public.is_admin());
create policy "client_logos public read" on public.client_logos for select using (is_visible or public.is_admin());
create policy "social_links public read" on public.social_links for select using (is_visible or public.is_admin());
create policy "site_settings public read" on public.site_settings for select using (true);

create policy "inquiries anon insert" on public.inquiries for insert to anon, authenticated with check (true);
create policy "inquiries admin read" on public.inquiries for select to authenticated using (public.is_admin());
create policy "inquiries admin update" on public.inquiries for update to authenticated using (public.is_admin());
create policy "inquiries admin delete" on public.inquiries for delete to authenticated using (public.is_admin());

create policy "categories admin write" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "projects admin write" on public.projects for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "project_images admin write" on public.project_images for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "services admin write" on public.services for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "pricing admin write" on public.pricing_tiers for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "testimonials admin write" on public.testimonials for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "client_logos admin write" on public.client_logos for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "social_links admin write" on public.social_links for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "site_settings admin write" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media public read" on storage.objects for select using (bucket_id = 'media');
create policy "media admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy "media admin update" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_admin());
create policy "media admin delete" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- Seed: admin allowlist (add more emails here or via the SQL editor)
insert into public.admins (email) values ('radic.studio@gmail.com') on conflict do nothing;

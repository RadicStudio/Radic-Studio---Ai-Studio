-- Tools used on projects, with optional icon uploaded by the owner.
create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon_url text,
  sort_order int not null default 0,
  is_visible boolean not null default true
);
alter table public.tools enable row level security;
create policy "tools public read" on public.tools for select using (true);
create policy "tools admin write" on public.tools for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.tools (name, sort_order) values ('Photoshop', 1), ('Illustrator', 2), ('CorelDRAW', 3), ('InDesign', 4)
on conflict (name) do nothing;

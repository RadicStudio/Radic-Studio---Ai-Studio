-- Ad and analytics tracking IDs, editable in Studio panel → Site settings.
-- Scripts only load after a visitor accepts cookies (see src/lib/analytics.ts).
alter table public.site_settings
  add column if not exists meta_pixel_id text,
  add column if not exists ga_measurement_id text;

comment on column public.site_settings.meta_pixel_id is 'Meta (Facebook/Instagram) Pixel ID, digits only.';
comment on column public.site_settings.ga_measurement_id is 'Google Analytics 4 measurement ID, e.g. G-XXXXXXXXXX.';

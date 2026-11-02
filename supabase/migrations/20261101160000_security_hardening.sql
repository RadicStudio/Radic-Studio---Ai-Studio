-- Pre-launch security hardening (1 Nov 2026).
-- 1. Least-privilege grants   2. Rate limiting + security log   3. Server-side validation of
-- public inserts   4. Rate-limited quote RPCs   5. Upload limits   6. Fixed function search paths

-------------------------------------------------------------------------------
-- 1. Least privilege. RLS already blocks these, but grants are the second wall.
-------------------------------------------------------------------------------
revoke truncate, trigger, references on all tables in schema public from anon, authenticated;
revoke insert, update, delete on all tables in schema public from anon;
grant insert on public.inquiries to anon;
revoke all on public.admins from anon;
alter default privileges in schema public revoke truncate, trigger, references on tables from anon, authenticated;

-------------------------------------------------------------------------------
-- 2. Rate limiting and a security log. `private` is not exposed through the API.
-------------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.rate_events (
  key text not null,
  at timestamptz not null default now()
);
create index if not exists rate_events_key_at on private.rate_events (key, at desc);

create table if not exists public.security_events (
  id bigserial primary key,
  at timestamptz not null default now(),
  kind text not null,
  ip text,
  detail jsonb
);
alter table public.security_events enable row level security;
drop policy if exists "security_events admin read" on public.security_events;
create policy "security_events admin read" on public.security_events
  for select to authenticated using (public.is_admin());
revoke insert, update, delete, truncate on public.security_events from anon, authenticated;
grant select on public.security_events to authenticated;

-- Caller's IP as seen by the API gateway (Cloudflare first, then the proxy chain).
create or replace function private.client_ip() returns text
language plpgsql stable set search_path = '' as $$
declare h json;
begin
  begin
    h := current_setting('request.headers', true)::json;
  exception when others then
    return null;
  end;
  return nullif(trim(coalesce(h->>'cf-connecting-ip', split_part(coalesce(h->>'x-forwarded-for', ''), ',', 1))), '');
end $$;

create or replace function private.log_event(p_kind text, p_detail jsonb default null) returns void
language sql security definer set search_path = '' as $$
  insert into public.security_events (kind, ip, detail) values (p_kind, private.client_ip(), p_detail);
$$;

-- true = allowed (and counted); false = over the limit (and logged).
create or replace function private.rate_ok(p_key text, p_max int, p_window interval) returns boolean
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if random() < 0.02 then
    delete from private.rate_events where at < now() - interval '2 days';
  end if;
  select count(*) into n from private.rate_events where key = p_key and at > now() - p_window;
  if n >= p_max then
    perform private.log_event('rate_limited', jsonb_build_object('key', p_key));
    return false;
  end if;
  insert into private.rate_events (key) values (p_key);
  return true;
end $$;

-- Edge functions (service role only) use this for their own limits.
create or replace function public.edge_rate_ok(p_key text, p_max int, p_seconds int) returns boolean
language sql security definer set search_path = '' as $$
  select private.rate_ok(p_key, p_max, make_interval(secs => p_seconds));
$$;
revoke all on function public.edge_rate_ok(text, int, int) from public, anon, authenticated;
grant execute on function public.edge_rate_ok(text, int, int) to service_role;

-------------------------------------------------------------------------------
-- 3. Server-side validation of public inquiries (contact form + quote flow).
--    Bad input is rejected; floods are dropped silently and logged.
-------------------------------------------------------------------------------
alter table public.inquiries add column if not exists notified_at timestamptz;

create or replace function public.inquiries_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare ip text := coalesce(private.client_ip(), 'unknown');
begin
  -- fields the public may never set
  new.status := 'new';
  new.created_at := now();
  new.notified_at := null;

  new.name := left(btrim(coalesce(new.name, '')), 120);
  new.email := lower(left(btrim(coalesce(new.email, '')), 200));
  new.message := btrim(coalesce(new.message, ''));
  new.budget_range := nullif(left(btrim(coalesce(new.budget_range, '')), 100), '');
  new.source := coalesce(nullif(btrim(coalesce(new.source, '')), ''), 'contact');

  if new.name = '' then raise exception 'Please add your name' using errcode = '22023'; end if;
  if new.email <> '' and new.email !~ '^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]{2,}$' then
    raise exception 'Please check your email address' using errcode = '22023';
  end if;
  if new.source = 'contact' and new.email = '' then raise exception 'Please add your email' using errcode = '22023'; end if;
  if new.message = '' or length(new.message) > 8000 then raise exception 'Message is empty or too long' using errcode = '22023'; end if;
  if new.source !~ '^[a-z-]{1,30}$' then raise exception 'Invalid source' using errcode = '22023'; end if;
  if new.brief is not null and (jsonb_typeof(new.brief) <> 'object' or pg_column_size(new.brief) > 20000) then
    raise exception 'Brief is invalid or too large' using errcode = '22023';
  end if;

  -- flood control: 5 per IP per 10 minutes, 100 site-wide per hour
  if not private.rate_ok('inq:ip:' || ip, 5, interval '10 minutes')
     or not private.rate_ok('inq:all', 100, interval '1 hour') then
    return null; -- dropped quietly, already logged
  end if;
  return new;
end $$;

drop trigger if exists inquiries_guard on public.inquiries;
create trigger inquiries_guard before insert on public.inquiries
  for each row execute function public.inquiries_guard();

-------------------------------------------------------------------------------
-- 4. Quote RPCs: same behaviour, now rate limited and logged.
-------------------------------------------------------------------------------
create or replace function public.get_quote(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare q public.quotes; ip text := coalesce(private.client_ip(), 'unknown');
begin
  if not private.rate_ok('quote:get:' || ip, 60, interval '10 minutes') then return null; end if;
  if p_token is null or p_token !~ '^[a-f0-9]{32,80}$' then
    perform private.log_event('quote_bad_token', null);
    return null;
  end if;
  select * into q from public.quotes where token = p_token and status <> 'draft';
  if not found then
    perform private.log_event('quote_not_found', null);
    return null;
  end if;
  if q.status = 'sent' then
    update public.quotes set status = 'viewed', viewed_at = now() where id = q.id
      returning * into q;
  end if;
  if q.status in ('sent','viewed') and q.valid_until is not null and q.valid_until < current_date then
    update public.quotes set status = 'expired' where id = q.id returning * into q;
  end if;
  return jsonb_build_object(
    'number', q.number, 'status', q.status,
    'client_name', q.client_name, 'client_business', q.client_business, 'client_email', q.client_email,
    'project_title', q.project_title, 'summary', q.summary, 'items', q.items, 'discount', q.discount,
    'timeline', q.timeline, 'revisions', q.revisions, 'deposit_percent', q.deposit_percent,
    'valid_until', q.valid_until, 'payment_link', q.payment_link, 'notes', q.notes,
    'created_at', q.created_at, 'sent_at', q.sent_at,
    'signed_at', q.signed_at, 'signer_name', q.signer_name, 'signature_kind', q.signature_kind,
    'signature_data', q.signature_data, 'studio_signer', q.studio_signer,
    'paid_at', q.paid_at, 'certificate_number', q.certificate_number,
    'certificate_issued_at', q.certificate_issued_at, 'deliverables_note', q.deliverables_note
  );
end $$;

create or replace function public.sign_quote(
  p_token text, p_name text, p_email text, p_kind text, p_signature text, p_agent text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare q public.quotes; ip text := private.client_ip();
begin
  if not private.rate_ok('quote:sign:' || coalesce(ip, 'unknown'), 10, interval '10 minutes') then
    raise exception 'Too many attempts. Please wait a few minutes and try again.';
  end if;
  select * into q from public.quotes where token = p_token;
  if not found then raise exception 'Quote not found'; end if;
  if q.status not in ('sent','viewed') then raise exception 'This quote can no longer be signed (status: %)', q.status; end if;
  if q.valid_until is not null and q.valid_until < current_date then raise exception 'This quote has expired'; end if;
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_signature), '') = '' then raise exception 'Name and signature are required'; end if;
  if p_kind not in ('typed','drawn') then raise exception 'Unknown signature type'; end if;
  if length(p_signature) > 400000 then raise exception 'Signature image is too large'; end if;
  if p_kind = 'drawn' and p_signature !~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$' then
    raise exception 'Signature image is invalid';
  end if;
  if p_kind = 'typed' and length(p_signature) > 200 then raise exception 'Typed signature is too long'; end if;
  update public.quotes set
    status = 'signed', signed_at = now(),
    signer_name = left(trim(p_name), 200), signer_email = left(trim(coalesce(p_email, '')), 200),
    signature_kind = p_kind, signature_data = p_signature,
    signer_ip = nullif(trim(coalesce(ip, '')), ''), signer_agent = left(coalesce(p_agent, ''), 400)
  where id = q.id;
  return public.get_quote(p_token);
end $$;

create or replace function public.decline_quote(p_token text, p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare q public.quotes;
begin
  if not private.rate_ok('quote:decline:' || coalesce(private.client_ip(), 'unknown'), 10, interval '10 minutes') then
    raise exception 'Too many attempts. Please wait a few minutes and try again.';
  end if;
  select * into q from public.quotes where token = p_token;
  if not found then raise exception 'Quote not found'; end if;
  if q.status not in ('sent','viewed') then raise exception 'This quote can no longer be declined'; end if;
  update public.quotes set status = 'declined',
    internal_notes = coalesce(internal_notes || E'\n\n', '') || 'Declined by client: ' || left(coalesce(p_reason, ''), 1000)
  where id = q.id;
  return public.get_quote(p_token);
end $$;

revoke all on function public.get_quote(text) from public;
revoke all on function public.sign_quote(text, text, text, text, text, text) from public;
revoke all on function public.decline_quote(text, text) from public;
grant execute on function public.get_quote(text) to anon, authenticated;
grant execute on function public.sign_quote(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.decline_quote(text, text) to anon, authenticated;

-------------------------------------------------------------------------------
-- 5. Uploads: images only, 15 MB max (admin-only uploads already enforced by RLS).
-------------------------------------------------------------------------------
update storage.buckets
   set file_size_limit = 15728640,
       allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/avif']
 where id = 'media';

-------------------------------------------------------------------------------
-- 6. Fixed search paths on trigger functions (Supabase linter 0011).
-------------------------------------------------------------------------------
alter function public.quotes_before_insert() set search_path = public;
alter function public.quotes_touch() set search_path = public;
alter function public.touch_updated_at() set search_path = public;

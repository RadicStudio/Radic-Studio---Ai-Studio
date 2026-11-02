-- Quotes with online signature and ownership certificates.
-- Admins create and manage quotes; clients open a quote through a private link
-- (an unguessable token) and can only read that one quote and sign it, through
-- the security-definer functions at the bottom. No public table access.

create sequence if not exists public.quote_number_seq;

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  number text unique,
  token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  inquiry_id uuid references public.inquiries(id) on delete set null,

  client_name text not null default '',
  client_business text,
  client_email text,
  client_phone text,

  project_title text not null default '',
  summary text,
  items jsonb not null default '[]'::jsonb,        -- [{description, detail, qty, unit_price}]
  discount numeric not null default 0,              -- naira off the subtotal
  timeline text,
  revisions int not null default 2,
  deposit_percent int not null default 50 check (deposit_percent between 0 and 100),
  valid_until date default (current_date + 14),
  payment_link text,                                -- e.g. a Paystack page for the deposit
  notes text,                                       -- shown to the client
  internal_notes text,                              -- studio only

  status text not null default 'draft'
    check (status in ('draft','sent','viewed','signed','paid','declined','expired')),
  sent_at timestamptz,
  viewed_at timestamptz,

  signed_at timestamptz,
  signer_name text,
  signer_email text,
  signature_kind text check (signature_kind in ('typed','drawn')),
  signature_data text,                              -- typed name or a PNG data URL
  signer_ip text,
  signer_agent text,
  studio_signer text not null default 'Collins Odoh, Founder',

  paid_at timestamptz,
  certificate_number text unique,
  certificate_issued_at timestamptz,
  deliverables_note text,                           -- file list / third-party assets for the certificate

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quotes_status_idx on public.quotes(status);
create index if not exists quotes_inquiry_idx on public.quotes(inquiry_id);

-- RS-2026-001 style numbers, assigned on insert.
create or replace function public.quotes_before_insert()
returns trigger language plpgsql as $$
begin
  if new.number is null or new.number = '' then
    new.number := 'RS-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.quote_number_seq')::text, 3, '0');
  end if;
  return new;
end $$;

drop trigger if exists quotes_number on public.quotes;
create trigger quotes_number before insert on public.quotes
  for each row execute function public.quotes_before_insert();

create or replace function public.quotes_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  -- Issue a certificate number the first time a quote is marked paid.
  if new.status = 'paid' and new.paid_at is null then
    new.paid_at := now();
  end if;
  if new.status = 'paid' and new.certificate_number is null then
    new.certificate_number := replace(new.number, 'RS-', 'RSC-');
    new.certificate_issued_at := now();
  end if;
  return new;
end $$;

drop trigger if exists quotes_touch on public.quotes;
create trigger quotes_touch before update on public.quotes
  for each row execute function public.quotes_touch();

alter table public.quotes enable row level security;
drop policy if exists "quotes admin all" on public.quotes;
create policy "quotes admin all" on public.quotes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Bank details shown on quotes for transfers.
alter table public.site_settings add column if not exists bank_name text;
alter table public.site_settings add column if not exists bank_account_name text;
alter table public.site_settings add column if not exists bank_account_number text;

-- Public read of ONE quote by its token. Marks it viewed the first time.
create or replace function public.get_quote(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare q public.quotes;
begin
  select * into q from public.quotes where token = p_token and status <> 'draft';
  if not found then return null; end if;
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

-- Client signs a quote. Records who, when, how and from where.
create or replace function public.sign_quote(
  p_token text, p_name text, p_email text, p_kind text, p_signature text, p_agent text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare q public.quotes; ip text;
begin
  select * into q from public.quotes where token = p_token;
  if not found then raise exception 'Quote not found'; end if;
  if q.status not in ('sent','viewed') then raise exception 'This quote can no longer be signed (status: %)', q.status; end if;
  if q.valid_until is not null and q.valid_until < current_date then raise exception 'This quote has expired'; end if;
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_signature), '') = '' then raise exception 'Name and signature are required'; end if;
  if p_kind not in ('typed','drawn') then raise exception 'Unknown signature type'; end if;
  if length(p_signature) > 400000 then raise exception 'Signature image is too large'; end if;
  begin
    ip := split_part(coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', ''), ',', 1);
  exception when others then ip := null;
  end;
  update public.quotes set
    status = 'signed', signed_at = now(),
    signer_name = left(trim(p_name), 200), signer_email = left(trim(coalesce(p_email, '')), 200),
    signature_kind = p_kind, signature_data = p_signature,
    signer_ip = nullif(trim(ip), ''), signer_agent = left(coalesce(p_agent, ''), 400)
  where id = q.id;
  return public.get_quote(p_token);
end $$;

-- Client declines a quote (optional reason goes into notes for the studio).
create or replace function public.decline_quote(p_token text, p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare q public.quotes;
begin
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

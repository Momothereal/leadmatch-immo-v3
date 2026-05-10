-- Enums
create type public.property_type as enum ('apartment','house','land','commercial','other');
create type public.transaction_type as enum ('sale','rent');
create type public.lead_transaction_type as enum ('buy','rent');
create type public.lead_timeline as enum ('immediate','1-3months','3-6months','6-12months','exploring');
create type public.lead_financing as enum ('approved','in_progress','not_started','cash','unknown');

-- properties
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  property_type public.property_type not null default 'apartment',
  transaction_type public.transaction_type not null default 'sale',
  price numeric,
  surface_m2 numeric,
  rooms integer,
  bedrooms integer,
  city text,
  postal_code text,
  neighborhood text,
  dpe_rating text,
  description text,
  features jsonb,
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.properties enable row level security;

create policy "Users select own properties" on public.properties
  for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own properties" on public.properties
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own properties" on public.properties
  for update to authenticated using (auth.uid() = user_id);
create policy "Users delete own properties" on public.properties
  for delete to authenticated using (auth.uid() = user_id);

create index idx_properties_user_id on public.properties(user_id);

-- leads
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  budget_min numeric,
  budget_max numeric,
  desired_property_type public.property_type,
  desired_transaction_type public.lead_transaction_type,
  desired_city text,
  desired_postal_code text,
  desired_surface_min numeric,
  desired_rooms_min integer,
  desired_features jsonb,
  timeline public.lead_timeline,
  financing public.lead_financing,
  notes text,
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads enable row level security;

create policy "Users select own leads" on public.leads
  for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own leads" on public.leads
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own leads" on public.leads
  for update to authenticated using (auth.uid() = user_id);
create policy "Users delete own leads" on public.leads
  for delete to authenticated using (auth.uid() = user_id);

create index idx_leads_user_id on public.leads(user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_properties_updated_at before update on public.properties
  for each row execute function public.set_updated_at();
create trigger trg_leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();
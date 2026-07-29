-- Applied via Supabase MCP; kept for reference
create table if not exists public.campaigns (
  id text primary key,
  name text not null,
  market_city text,
  market_country text,
  market_country_code text,
  pipeline text not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_state (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null references public.campaigns(id) on delete cascade,
  pipeline text not null,
  company_name text,
  company_domain text,
  industry text,
  city text,
  country text,
  icp_score numeric,
  icp_tier text,
  contact_1_name text,
  contact_1_email text,
  primary_service text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists leads_campaign_domain_uidx
  on public.leads (campaign_id, company_domain);

create index if not exists leads_campaign_tier_idx on public.leads (campaign_id, icp_tier);
create index if not exists leads_campaign_score_idx on public.leads (campaign_id, icp_score desc nulls last);
create index if not exists leads_payload_gin on public.leads using gin (payload);

alter table public.campaigns enable row level security;
alter table public.app_state enable row level security;
alter table public.leads enable row level security;

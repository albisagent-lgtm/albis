create table if not exists public.launch_attribution_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_name text not null check (char_length(event_name) <= 64),
  page_path text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  referrer text,
  user_agent_hash text,
  email_hash text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists launch_attribution_events_created_at_idx
  on public.launch_attribution_events (created_at desc);

create index if not exists launch_attribution_events_route_idx
  on public.launch_attribution_events (utm_source, utm_campaign, utm_content, event_name);

alter table public.launch_attribution_events enable row level security;

-- Server-side inserts use the service-role key through /api/attribution/event.
-- No anonymous browser read/write policy is exposed for this private measurement table.

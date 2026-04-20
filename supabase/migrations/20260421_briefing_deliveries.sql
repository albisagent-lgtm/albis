create table if not exists briefing_deliveries (
  id uuid primary key default gen_random_uuid(),
  briefing_date date not null,
  briefing_id uuid null references briefings(id) on delete set null,
  subscriber_email text not null,
  subscriber_id uuid null,
  status text not null default 'pending',
  sent_at timestamptz null,
  error text null,
  run_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists briefing_deliveries_briefing_date_email_key
  on briefing_deliveries (briefing_date, subscriber_email);

create index if not exists briefing_deliveries_briefing_date_idx
  on briefing_deliveries (briefing_date);

create index if not exists briefing_deliveries_status_idx
  on briefing_deliveries (status);

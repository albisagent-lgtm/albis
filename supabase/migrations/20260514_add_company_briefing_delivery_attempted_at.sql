-- Company briefing delivery claim audit column.
-- The production delivery endpoint writes this when claiming a pending row.
alter table public.company_briefings
  add column if not exists delivery_attempted_at timestamptz;

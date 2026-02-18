-- Albis MVP Database Schema
-- Phase 1A: Core tables for scans, users, preferences, framing watch, deep dives

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  tier text not null default 'free' check (tier in ('free', 'premium', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- USER PREFERENCES
-- ============================================================
create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  topics text[] not null default '{}',
  regions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_preferences_user_id_unique unique (user_id)
);

-- ============================================================
-- SCANS (one row per scan file / time slot)
-- ============================================================
create table public.scans (
  id uuid primary key default gen_random_uuid(),
  scan_date date not null,
  scan_time text not null default 'pm' check (scan_time in ('am', 'pm')),
  top_theme text,
  mood text,
  pattern_summary text,
  weather_summary text,
  flows_summary text,
  framing_summary text,
  notable_summary text,
  raw_markdown text,
  item_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scans_date_time_unique unique (scan_date, scan_time)
);

-- ============================================================
-- SCAN ITEMS (individual news items from JSON blocks)
-- ============================================================
create table public.scan_items (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  headline text not null,
  category text not null,
  regions text[] not null default '{}',
  tags text[] not null default '{}',
  patterns text[] not null default '{}',
  significance text not null default 'medium' check (significance in ('low', 'medium', 'high')),
  connection text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- FRAMING WATCH (stories with divergent framing across regions)
-- ============================================================
create table public.framing_watch (
  id uuid primary key default gen_random_uuid(),
  scan_item_id uuid references public.scan_items(id) on delete set null,
  headline text not null,
  summary text,
  regions text[] not null default '{}',
  frames jsonb not null default '[]',
  detected_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ============================================================
-- DEEP DIVES (cached Sonnet analysis per story)
-- ============================================================
create table public.deep_dives (
  id uuid primary key default gen_random_uuid(),
  scan_item_id uuid references public.scan_items(id) on delete set null,
  headline text not null,
  analysis text not null,
  model text not null default 'claude-sonnet-4-5-20250929',
  prompt_tokens int,
  completion_tokens int,
  cost_usd numeric(10, 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_scans_date on public.scans(scan_date desc);
create index idx_scan_items_scan_id on public.scan_items(scan_id);
create index idx_scan_items_category on public.scan_items(category);
create index idx_scan_items_significance on public.scan_items(significance);
create index idx_scan_items_regions on public.scan_items using gin(regions);
create index idx_scan_items_tags on public.scan_items using gin(tags);
create index idx_scan_items_patterns on public.scan_items using gin(patterns);
create index idx_framing_watch_detected on public.framing_watch(detected_at desc);
create index idx_deep_dives_scan_item on public.deep_dives(scan_item_id);
create index idx_user_preferences_user on public.user_preferences(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Users: can read own row, admins can read all
alter table public.users enable row level security;

create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- User preferences: own data only
alter table public.user_preferences enable row level security;

create policy "Users can view own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);

-- Scans: public read access
alter table public.scans enable row level security;

create policy "Scans are publicly readable"
  on public.scans for select
  using (true);

-- Scan items: public read access
alter table public.scan_items enable row level security;

create policy "Scan items are publicly readable"
  on public.scan_items for select
  using (true);

-- Framing watch: premium users only
alter table public.framing_watch enable row level security;

create policy "Framing watch readable by premium users"
  on public.framing_watch for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and tier in ('premium', 'admin')
    )
  );

-- Deep dives: premium users only
alter table public.deep_dives enable row level security;

create policy "Deep dives readable by premium users"
  on public.deep_dives for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and tier in ('premium', 'admin')
    )
  );

-- ============================================================
-- SERVICE ROLE POLICIES (for sync script & admin)
-- ============================================================
-- The sync script uses the service_role key which bypasses RLS.
-- No additional policies needed for inserts from the pipeline.

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.handle_updated_at();

create trigger scans_updated_at
  before update on public.scans
  for each row execute function public.handle_updated_at();

create trigger deep_dives_updated_at
  before update on public.deep_dives
  for each row execute function public.handle_updated_at();

-- ============================================================
-- TRIGGER: auto-create user profile on auth signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Albis growth metrics production verification bundle
-- Created 2026-06-18.
-- Purpose: run after `npm run growth:metrics-sql` has been applied in production Supabase.
-- This file is read-only. It checks whether required tables, indexes, RLS, and public read policy exist.
-- Follow with endpoint verification:
--   npm run growth:metrics-check

select
  'launch_attribution_events_table' as check_name,
  to_regclass('public.launch_attribution_events') is not null as ok;

select
  'feed_events_table' as check_name,
  to_regclass('public.feed_events') is not null as ok;

select
  'feed_scores_table' as check_name,
  to_regclass('public.feed_scores') is not null as ok;

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('launch_attribution_events', 'feed_events', 'feed_scores')
order by c.relname;

select
  indexname,
  tablename
from pg_indexes
where schemaname = 'public'
  and tablename in ('launch_attribution_events', 'feed_events', 'feed_scores')
  and indexname in (
    'launch_attribution_events_created_at_idx',
    'launch_attribution_events_route_idx',
    'idx_feed_events_card_created',
    'idx_feed_events_type_created',
    'idx_feed_events_anon_created',
    'idx_feed_scores_score',
    'idx_feed_scores_last_activity'
  )
order by tablename, indexname;

select
  'feed_scores_public_read_policy' as check_name,
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'feed_scores'
      and policyname = 'Feed scores are publicly readable'
      and cmd = 'SELECT'
  ) as ok;

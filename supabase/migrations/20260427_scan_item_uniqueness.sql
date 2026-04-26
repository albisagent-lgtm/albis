-- Make mirrored scan_items safe for reruns.
-- Keep the newest copy when duplicates already exist, then enforce one row per scan/headline.

delete from public.scan_items a
using public.scan_items b
where a.scan_id = b.scan_id
  and lower(trim(a.headline)) = lower(trim(b.headline))
  and a.id <> b.id
  and a.created_at < b.created_at;

delete from public.scan_items a
using public.scan_items b
where a.scan_id = b.scan_id
  and lower(trim(a.headline)) = lower(trim(b.headline))
  and a.id <> b.id
  and a.created_at = b.created_at
  and a.id::text < b.id::text;

create unique index if not exists scan_items_scan_id_headline_key
  on public.scan_items (scan_id, headline);

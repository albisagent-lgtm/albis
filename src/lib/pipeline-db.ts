import type { SupabaseClient } from '@supabase/supabase-js';
import type { ScanItemInput } from './relevance-engine';

export type ScanPeriod = 'am' | 'midday' | 'pm';

type ScanRow = {
  id: string;
  scan_date: string;
  scan_time: string;
  items: any[] | null;
};

function fail(message: string): never {
  throw new Error(message);
}

function normaliseCategory(cat: string): string {
  return String(cat || '').replace(/_/g, '-');
}

function normaliseSignificance(sig: string): 'high' | 'medium' | 'low' {
  if (!sig) return 'medium';
  const upper = sig.toUpperCase();
  if (upper.startsWith('CRITICAL') || upper.startsWith('HIGH')) return 'high';
  if (upper.startsWith('LOW') || upper.startsWith('MINOR')) return 'low';
  if (upper.startsWith('MEDIUM') || upper.startsWith('MODERATE')) return 'medium';
  if (sig === 'high' || sig === 'medium' || sig === 'low') return sig;
  return 'medium';
}

export async function requireScanRows(
  supabase: SupabaseClient,
  scanDate: string,
  scanPeriod?: ScanPeriod
): Promise<ScanRow[]> {
  let query = supabase
    .from('scans')
    .select('id, scan_date, scan_time, items')
    .eq('scan_date', scanDate)
    .order('scan_time', { ascending: true });

  if (scanPeriod) query = query.eq('scan_time', scanPeriod);

  const { data, error } = await query;
  if (error) fail(`Failed to load scans rows: ${error.message}`);
  if (!data || data.length === 0) {
    fail(`No scans row found for ${scanDate}${scanPeriod ? ` ${scanPeriod}` : ''}`);
  }

  const rows = data as ScanRow[];
  const emptyRows = rows.filter((row) => !Array.isArray(row.items) || row.items.length === 0);
  if (emptyRows.length > 0) {
    fail(`Found scan rows with empty items for ${scanDate}${scanPeriod ? ` ${scanPeriod}` : ''}`);
  }

  return rows;
}

export async function requireScanItemsAvailability(
  supabase: SupabaseClient,
  scanRows: Array<{ id: string; scan_time: string; items: any[] | null }>
): Promise<number> {
  const scanIds = scanRows.map((row) => row.id);
  const expected = scanRows.reduce((sum, row) => sum + (Array.isArray(row.items) ? row.items.length : 0), 0);
  if (scanIds.length === 0) fail('No scan rows available for scan_items verification');

  const { count, error } = await supabase
    .from('scan_items')
    .select('id', { count: 'exact', head: true })
    .in('scan_id', scanIds);

  if (error) fail(`Failed to verify scan_items: ${error.message}`);
  if (!count || count <= 0) fail('scan_items verification failed: no mirrored rows found');
  if (count < expected) {
    fail(`scan_items verification failed: expected at least ${expected} mirrored rows, found ${count}`);
  }

  return count;
}

export async function loadVerifiedScanItems(
  supabase: SupabaseClient,
  scanDate: string,
  scanPeriod?: ScanPeriod
): Promise<ScanItemInput[]> {
  const rows = await requireScanRows(supabase, scanDate, scanPeriod);
  await requireScanItemsAvailability(supabase, rows);

  const allItems: ScanItemInput[] = [];
  for (const row of rows) {
    const items = Array.isArray(row.items) ? row.items : [];
    for (const item of items) {
      if (!item?.headline || !item?.category) continue;
      allItems.push({
        headline: item.headline,
        category: normaliseCategory(item.category),
        regions: Array.isArray(item.regions) ? item.regions : [],
        tags: Array.isArray(item.tags) ? item.tags : [],
        patterns: Array.isArray(item.patterns) ? item.patterns : [],
        significance: normaliseSignificance(item.significance || 'medium'),
        connection: item.connection || '',
        perception_gap: item.perception_gap ?? null,
        coverage_breadth: item.coverage_breadth ?? null,
      });
    }
  }

  const seen = new Set<string>();
  const deduped = allItems.filter((item) => {
    const key = item.headline.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (deduped.length === 0) {
    fail(`No verified scan items available for ${scanDate}${scanPeriod ? ` ${scanPeriod}` : ''}`);
  }

  return deduped;
}

export async function requireStoryScores(
  supabase: SupabaseClient,
  scanDate: string,
  scanPeriod?: ScanPeriod
): Promise<{ pgiCount: number; gaiCount: number }> {
  let pgiQuery = supabase
    .from('pgi_story_scores')
    .select('id', { count: 'exact', head: true })
    .eq('scan_date', scanDate);
  let gaiQuery = supabase
    .from('gai_story_scores')
    .select('id', { count: 'exact', head: true })
    .eq('scan_date', scanDate);

  if (scanPeriod) {
    pgiQuery = pgiQuery.eq('scan_period', scanPeriod);
    gaiQuery = gaiQuery.eq('scan_period', scanPeriod);
  }

  const [{ count: pgiCount, error: pgiError }, { count: gaiCount, error: gaiError }] = await Promise.all([
    pgiQuery,
    gaiQuery,
  ]);

  if (pgiError) fail(`PGI verify failed: ${pgiError.message}`);
  if (gaiError) fail(`GAI verify failed: ${gaiError.message}`);
  if (!pgiCount || pgiCount <= 0) fail(`No PGI rows found for ${scanDate}${scanPeriod ? ` ${scanPeriod}` : ''}`);
  if (!gaiCount || gaiCount <= 0) fail(`No GAI rows found for ${scanDate}${scanPeriod ? ` ${scanPeriod}` : ''}`);

  return { pgiCount, gaiCount };
}

export async function requireBriefingRow(supabase: SupabaseClient, briefingDate: string) {
  const { data, error } = await supabase
    .from('briefings')
    .select('id, date, title, content_md, delivery_status')
    .eq('date', briefingDate)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) fail(`Briefing verify failed: ${error.message}`);
  if (!data) fail(`No briefing row found for ${briefingDate}`);
  return data;
}

export async function requireCompanyBriefingRows(supabase: SupabaseClient, briefingDate: string) {
  const { data, error } = await supabase
    .from('company_briefings')
    .select('id, company_profile_id, briefing_date, status, delivery_status')
    .eq('briefing_date', briefingDate);

  if (error) fail(`Company briefing verify failed: ${error.message}`);
  if (!data || data.length === 0) fail(`No company_briefings rows found for ${briefingDate}`);
  return data;
}

export async function requireSnapshotForDate(supabase: SupabaseClient, scanDate: string) {
  const { data, error } = await supabase
    .from('site_snapshot')
    .select('id, scan_date, updated_at')
    .eq('id', 1)
    .single();

  if (error) fail(`Snapshot verify failed: ${error.message}`);
  if (!data || data.scan_date !== scanDate) {
    fail(`Snapshot scan_date not updated to ${scanDate}`);
  }
  return data;
}

import { createAdminClient } from '@/lib/supabase/admin';

export interface PublicPgiStory {
  scanDate: string;
  headline: string;
  pgi: number;
}

export interface PublicGaiStory {
  scanDate: string;
  headline: string;
  gai: number;
}

export interface PublicIndexDataset {
  generatedAt: string;
  pgiStories: PublicPgiStory[];
  gaiStories: PublicGaiStory[];
}

export async function getPublicIndexDataset(limit = 50): Promise<PublicIndexDataset> {
  try {
    const supabase = createAdminClient();
    const [pgi, gai] = await Promise.all([
      supabase
        .from('pgi_story_scores')
        .select('scan_date, story_headline, story_pgi')
        .order('scan_date', { ascending: false })
        .limit(limit),
      supabase
        .from('gai_story_scores')
        .select('scan_date, story_headline, story_gai')
        .order('scan_date', { ascending: false })
        .limit(limit),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      pgiStories: (pgi.data || []).map((row) => ({
        scanDate: String(row.scan_date),
        headline: String(row.story_headline),
        pgi: Number(row.story_pgi),
      })),
      gaiStories: (gai.data || []).map((row) => ({
        scanDate: String(row.scan_date),
        headline: String(row.story_headline),
        gai: Number(row.story_gai),
      })),
    };
  } catch (error) {
    console.warn('[public-index-data] failed:', error);
    return { generatedAt: new Date().toISOString(), pgiStories: [], gaiStories: [] };
  }
}

export function toCsv(rows: Array<Record<string, string | number>>) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map((row) => headers.map((header) => esc(row[header])).join(','))].join('\n');
}

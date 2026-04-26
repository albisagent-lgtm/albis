#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// Seed the canonical topic / alias registry.
//
// V1 starter set: derives ~150 canonicals from the existing onboarding
// taxonomy (themes, watchlist, supply chain, regions, sectors, risks),
// then adds a hand-curated layer with multi-language and synonym aliases
// for the most strategically important entities (North Korea, China, the
// EU, Hormuz, sanctions, AI regulation, shipping disruption, etc.).
//
// Idempotent. Re-running:
//   - finds existing canonicals by (lower(canonical_label), topic_type)
//   - inserts only missing aliases via ON CONFLICT DO NOTHING (the
//     coalesce(language,'') unique index handles language-aware dedupe)
//
// Usage: npx tsx scripts/seed-canonical-registry.ts
// ---------------------------------------------------------------------------
import path from 'path';
import dotenv from 'dotenv';
import { createAdminClient } from '../src/lib/supabase/admin';
import {
  THEME_CATALOG,
  WATCHLIST_CATALOG,
  SUPPLY_CHAIN_CATALOG,
  COMPANY_REGIONS,
  SECTORS,
  type TaxonomyOption,
} from '../src/lib/onboarding-taxonomy';
import { RISK_PRIORITIES } from '../src/lib/company-profile';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

type TopicType =
  | 'entity'
  | 'theme'
  | 'region'
  | 'sector'
  | 'commodity'
  | 'policy'
  | 'route'
  | 'risk'
  | 'institution';

type AliasType = 'synonym' | 'translation' | 'abbreviation' | 'related_entity';

interface AliasInput {
  alias: string;
  language?: string | null;
  type?: AliasType;
  confidence?: number;
}

interface CanonicalSeed {
  canonical_label: string;
  topic_type: TopicType;
  short_description?: string;
  aliases: AliasInput[];
}

// ---------------------------------------------------------------------------
// 1) Catalog-derived canonicals.
// ---------------------------------------------------------------------------

function catalogToSeed(
  options: TaxonomyOption[],
  pickType: (opt: TaxonomyOption) => TopicType
): CanonicalSeed[] {
  return options.map((opt) => {
    const aliases: AliasInput[] = [];
    const aliasSet = new Set<string>();
    const push = (s: string, type: AliasType = 'synonym') => {
      const trimmed = s.trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (aliasSet.has(key) || key === opt.label.toLowerCase()) return;
      aliasSet.add(key);
      aliases.push({ alias: trimmed, language: 'en', type });
    };
    push(opt.value, 'synonym');
    for (const tag of opt.scanTags || []) push(tag, 'synonym');
    return {
      canonical_label: opt.label,
      topic_type: pickType(opt),
      aliases,
    };
  });
}

const themeSeed = catalogToSeed(THEME_CATALOG, () => 'theme');

const watchlistSeed = catalogToSeed(WATCHLIST_CATALOG, (o) => {
  switch (o.category) {
    case 'Organisations':
      return 'institution';
    default:
      return 'entity';
  }
});

const supplyChainSeed = catalogToSeed(SUPPLY_CHAIN_CATALOG, (o) => {
  if (o.category === 'Routes') return 'route';
  if (o.category === 'Commodities') return 'commodity';
  return 'theme';
});

const regionSeed: CanonicalSeed[] = COMPANY_REGIONS.map((r) => ({
  canonical_label: r.label,
  topic_type: 'region',
  aliases: [{ alias: r.id, language: 'en', type: 'synonym' }],
}));

const sectorSeed: CanonicalSeed[] = SECTORS.map((s) => ({
  canonical_label: s.label,
  topic_type: 'sector',
  aliases: [{ alias: s.id, language: 'en', type: 'synonym' }],
}));

const riskSeed: CanonicalSeed[] = RISK_PRIORITIES.map((r) => ({
  canonical_label: r.label,
  topic_type: 'risk',
  aliases: [{ alias: r.id, language: 'en', type: 'synonym' }],
}));

// ---------------------------------------------------------------------------
// 2) Curated canonicals — rich aliases including translations and the
// strategically important entities Package 4 calls out by name. Catalog
// items with the same canonical_label merge into these via the
// (lower(label), topic_type) uniqueness — adding aliases to existing rows.
// ---------------------------------------------------------------------------
const curatedSeed: CanonicalSeed[] = [
  {
    canonical_label: 'North Korea',
    topic_type: 'entity',
    short_description: 'Democratic People’s Republic of Korea — its leadership, military, and policy moves.',
    aliases: [
      { alias: 'DPRK', language: 'en', type: 'abbreviation' },
      { alias: 'Pyongyang', language: 'en', type: 'related_entity' },
      { alias: 'Kim Jong Un', language: 'en', type: 'related_entity' },
      { alias: 'Kim Yo Jong', language: 'en', type: 'related_entity' },
      { alias: 'DPRK leadership', language: 'en', type: 'synonym' },
      { alias: 'North Korean regime', language: 'en', type: 'synonym' },
      { alias: '朝鮮', language: 'ko', type: 'translation' },
      { alias: '北朝鮮', language: 'ja', type: 'translation' },
      { alias: '朝鲜民主主义人民共和国', language: 'zh', type: 'translation' },
    ],
  },
  {
    canonical_label: 'China',
    topic_type: 'entity',
    short_description: 'People’s Republic of China — its leadership, economy, and external posture.',
    aliases: [
      { alias: 'PRC', language: 'en', type: 'abbreviation' },
      { alias: 'Beijing', language: 'en', type: 'related_entity' },
      { alias: 'mainland China', language: 'en', type: 'synonym' },
      { alias: 'People’s Republic of China', language: 'en', type: 'synonym' },
      { alias: 'Xi Jinping', language: 'en', type: 'related_entity' },
      { alias: '中国', language: 'zh', type: 'translation' },
      { alias: '中華人民共和國', language: 'zh', type: 'translation' },
      { alias: 'Chine', language: 'fr', type: 'translation' },
      { alias: '中国', language: 'ja', type: 'translation' },
    ],
  },
  {
    canonical_label: 'European Union',
    topic_type: 'institution',
    short_description: 'EU institutions — Commission, Parliament, Council — and pan-EU policy actions.',
    aliases: [
      { alias: 'EU', language: 'en', type: 'abbreviation' },
      { alias: 'Brussels', language: 'en', type: 'related_entity' },
      { alias: 'European Commission', language: 'en', type: 'related_entity' },
      { alias: 'Eurozone', language: 'en', type: 'related_entity' },
      { alias: 'Union européenne', language: 'fr', type: 'translation' },
      { alias: 'Europäische Union', language: 'de', type: 'translation' },
    ],
  },
  {
    canonical_label: 'Russia',
    topic_type: 'entity',
    aliases: [
      { alias: 'Moscow', language: 'en', type: 'related_entity' },
      { alias: 'Kremlin', language: 'en', type: 'related_entity' },
      { alias: 'Russian Federation', language: 'en', type: 'synonym' },
      { alias: 'Putin', language: 'en', type: 'related_entity' },
      { alias: 'Россия', language: 'ru', type: 'translation' },
    ],
  },
  {
    canonical_label: 'Iran',
    topic_type: 'entity',
    aliases: [
      { alias: 'Tehran', language: 'en', type: 'related_entity' },
      { alias: 'Islamic Republic of Iran', language: 'en', type: 'synonym' },
      { alias: 'Iranian regime', language: 'en', type: 'synonym' },
      { alias: 'إيران', language: 'ar', type: 'translation' },
      { alias: 'IRGC', language: 'en', type: 'related_entity' },
    ],
  },
  {
    canonical_label: 'Israel',
    topic_type: 'entity',
    aliases: [
      { alias: 'Tel Aviv', language: 'en', type: 'related_entity' },
      { alias: 'Jerusalem', language: 'en', type: 'related_entity' },
      { alias: 'IDF', language: 'en', type: 'related_entity' },
      { alias: 'Israeli government', language: 'en', type: 'synonym' },
    ],
  },
  {
    canonical_label: 'Ukraine',
    topic_type: 'entity',
    aliases: [
      { alias: 'Kyiv', language: 'en', type: 'related_entity' },
      { alias: 'Kiev', language: 'en', type: 'synonym' },
      { alias: 'Zelensky', language: 'en', type: 'related_entity' },
      { alias: 'Україна', language: 'uk', type: 'translation' },
    ],
  },
  {
    canonical_label: 'United States',
    topic_type: 'entity',
    aliases: [
      { alias: 'US', language: 'en', type: 'abbreviation' },
      { alias: 'USA', language: 'en', type: 'abbreviation' },
      { alias: 'America', language: 'en', type: 'synonym' },
      { alias: 'Washington', language: 'en', type: 'related_entity' },
      { alias: 'White House', language: 'en', type: 'related_entity' },
      { alias: 'United States of America', language: 'en', type: 'synonym' },
    ],
  },
  {
    canonical_label: 'United Kingdom',
    topic_type: 'entity',
    aliases: [
      { alias: 'UK', language: 'en', type: 'abbreviation' },
      { alias: 'Britain', language: 'en', type: 'synonym' },
      { alias: 'London', language: 'en', type: 'related_entity' },
      { alias: 'Whitehall', language: 'en', type: 'related_entity' },
      { alias: 'Downing Street', language: 'en', type: 'related_entity' },
    ],
  },
  {
    canonical_label: 'Strait of Hormuz',
    topic_type: 'route',
    short_description: 'Critical maritime chokepoint between the Persian Gulf and the Gulf of Oman.',
    aliases: [
      { alias: 'Hormuz', language: 'en', type: 'synonym' },
      { alias: 'Persian Gulf shipping', language: 'en', type: 'synonym' },
      { alias: 'Gulf chokepoint', language: 'en', type: 'synonym' },
    ],
  },
  {
    canonical_label: 'Red Sea',
    topic_type: 'route',
    aliases: [
      { alias: 'Bab-el-Mandeb', language: 'en', type: 'related_entity' },
      { alias: 'Houthi attacks', language: 'en', type: 'related_entity' },
      { alias: 'Suez approach', language: 'en', type: 'synonym' },
    ],
  },
  {
    canonical_label: 'Sanctions',
    topic_type: 'theme',
    short_description: 'Trade, financial, and secondary sanctions enforcement against individuals, entities, or states.',
    aliases: [
      { alias: 'trade sanctions', language: 'en', type: 'synonym' },
      { alias: 'financial sanctions', language: 'en', type: 'synonym' },
      { alias: 'secondary sanctions', language: 'en', type: 'synonym' },
      { alias: 'export controls', language: 'en', type: 'synonym' },
      { alias: 'OFAC', language: 'en', type: 'related_entity' },
      { alias: 'sanctions package', language: 'en', type: 'synonym' },
    ],
  },
  {
    canonical_label: 'AI regulation',
    topic_type: 'theme',
    short_description: 'AI policy, governance, and regulatory regimes (EU AI Act, US executive orders, etc.).',
    aliases: [
      { alias: 'AI policy', language: 'en', type: 'synonym' },
      { alias: 'artificial intelligence regulation', language: 'en', type: 'synonym' },
      { alias: 'AI Act', language: 'en', type: 'related_entity' },
      { alias: 'EU AI Act', language: 'en', type: 'related_entity' },
      { alias: 'AI governance', language: 'en', type: 'synonym' },
      { alias: 'AI safety regulation', language: 'en', type: 'synonym' },
    ],
  },
  {
    canonical_label: 'Shipping disruption',
    topic_type: 'theme',
    short_description: 'Disruptions to maritime, port, freight, or container logistics.',
    aliases: [
      { alias: 'port disruption', language: 'en', type: 'synonym' },
      { alias: 'freight disruption', language: 'en', type: 'synonym' },
      { alias: 'supply chain disruption', language: 'en', type: 'synonym' },
      { alias: 'container shortage', language: 'en', type: 'synonym' },
      { alias: 'port congestion', language: 'en', type: 'synonym' },
    ],
  },
  {
    canonical_label: 'OPEC',
    topic_type: 'institution',
    aliases: [
      { alias: 'OPEC+', language: 'en', type: 'synonym' },
      { alias: 'Organization of Petroleum Exporting Countries', language: 'en', type: 'synonym' },
    ],
  },
  {
    canonical_label: 'NATO',
    topic_type: 'institution',
    aliases: [
      { alias: 'North Atlantic Treaty Organization', language: 'en', type: 'synonym' },
      { alias: 'transatlantic alliance', language: 'en', type: 'synonym' },
    ],
  },
];

const ALL_SEEDS: CanonicalSeed[] = [
  ...regionSeed,
  ...sectorSeed,
  ...riskSeed,
  ...themeSeed,
  ...watchlistSeed,
  ...supplyChainSeed,
  ...curatedSeed,
];

// ---------------------------------------------------------------------------
// Insert logic
// ---------------------------------------------------------------------------
async function findOrCreateCanonical(
  supabase: ReturnType<typeof createAdminClient>,
  seed: CanonicalSeed
): Promise<{ id: string; created: boolean } | null> {
  const { data: existing } = await supabase
    .from('canonical_topics')
    .select('id')
    .eq('topic_type', seed.topic_type)
    .ilike('canonical_label', seed.canonical_label)
    .maybeSingle();

  if (existing?.id) {
    if (seed.short_description) {
      // Backfill short_description if it was previously null.
      await supabase
        .from('canonical_topics')
        .update({ short_description: seed.short_description })
        .eq('id', existing.id)
        .is('short_description', null);
    }
    return { id: existing.id, created: false };
  }

  const { data: inserted, error } = await supabase
    .from('canonical_topics')
    .insert({
      canonical_label: seed.canonical_label,
      topic_type: seed.topic_type,
      short_description: seed.short_description ?? null,
    })
    .select('id')
    .single();

  if (error || !inserted) {
    // Concurrent insert may have raced us — try one more lookup.
    const { data: retry } = await supabase
      .from('canonical_topics')
      .select('id')
      .eq('topic_type', seed.topic_type)
      .ilike('canonical_label', seed.canonical_label)
      .maybeSingle();
    if (retry?.id) return { id: retry.id, created: false };
    console.warn(
      `⚠️ failed to insert canonical "${seed.canonical_label}" (${seed.topic_type}): ${error?.message || 'unknown'}`
    );
    return null;
  }
  return { id: inserted.id, created: true };
}

async function insertAliases(
  supabase: ReturnType<typeof createAdminClient>,
  canonicalId: string,
  aliases: AliasInput[]
): Promise<{ inserted: number; skipped: number }> {
  if (aliases.length === 0) return { inserted: 0, skipped: 0 };

  const seen = new Set<string>();
  const rows = aliases
    .map((a) => ({
      canonical_topic_id: canonicalId,
      alias: a.alias.trim(),
      alias_language: a.language ?? null,
      alias_type: a.type ?? 'synonym',
      confidence: a.confidence ?? 1.0,
    }))
    .filter((r) => {
      if (!r.alias) return false;
      const key = `${r.alias.toLowerCase()}::${r.alias_language || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  if (rows.length === 0) return { inserted: 0, skipped: 0 };

  // Insert one at a time so a single dup doesn't fail the whole batch. The
  // unique index on (topic_id, lower(alias), coalesce(language,'')) handles
  // the actual dedupe. Volume is small (a few thousand aliases total).
  let inserted = 0;
  let skipped = 0;
  for (const row of rows) {
    const { error } = await supabase.from('canonical_topic_aliases').insert(row);
    if (!error) {
      inserted += 1;
    } else if (
      error.code === '23505' || // unique_violation
      /duplicate key/i.test(error.message)
    ) {
      skipped += 1;
    } else {
      console.warn(
        `⚠️ failed to insert alias "${row.alias}" for ${canonicalId}: ${error.message}`
      );
    }
  }
  return { inserted, skipped };
}

async function main() {
  const supabase = createAdminClient();

  let canonicalsCreated = 0;
  let canonicalsExisting = 0;
  let canonicalsFailed = 0;
  let aliasesInserted = 0;
  let aliasesSkipped = 0;

  for (const seed of ALL_SEEDS) {
    const result = await findOrCreateCanonical(supabase, seed);
    if (!result) {
      canonicalsFailed += 1;
      continue;
    }
    if (result.created) canonicalsCreated += 1;
    else canonicalsExisting += 1;

    const { inserted, skipped } = await insertAliases(supabase, result.id, seed.aliases);
    aliasesInserted += inserted;
    aliasesSkipped += skipped;
  }

  console.log('\n✨ canonical registry seed complete');
  console.log(
    `   canonical_topics: ${canonicalsCreated} created, ${canonicalsExisting} already existed${
      canonicalsFailed > 0 ? `, ${canonicalsFailed} failed` : ''
    }`
  );
  console.log(
    `   canonical_topic_aliases: ${aliasesInserted} inserted, ${aliasesSkipped} skipped (already present)`
  );
}

main().catch((err) => {
  console.error('❌ seed failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});

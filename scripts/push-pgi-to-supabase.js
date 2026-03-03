#!/usr/bin/env node

/**
 * Push PGI scores from daily scan files to Supabase
 * 
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/push-pgi-to-supabase.js [YYYY-MM-DD]
 * 
 * If no date provided, uses today (Pacific/Auckland timezone)
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://wguydvzpxwsgrhvojpnk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Get today's date in NZST/Pacific Auckland timezone
 */
function getTodayNZ() {
  const now = new Date();
  const nzFormatter = new Intl.DateTimeFormat('en-NZ', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const parts = nzFormatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  
  return `${year}-${month}-${day}`;
}

/**
 * Parse PGI scores from markdown file
 */
function parsePGIScores(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Scan file not found: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const results = [];

  // Match sections like "## AM PGI Scores", "## Midday PGI Scores", "## PM PGI Scores"
  const sectionRegex = /## (AM|Midday|PM) PGI Scores\s*```json\s*(\{[\s\S]*?\})\s*```/gi;
  
  let match;
  while ((match = sectionRegex.exec(content)) !== null) {
    const periodRaw = match[1];
    const jsonStr = match[2];
    
    // Map period name to lowercase
    const period = periodRaw.toLowerCase();
    
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.pgi_scores && Array.isArray(parsed.pgi_scores)) {
        results.push({
          period,
          scores: parsed.pgi_scores
        });
      }
    } catch (err) {
      console.error(`❌ Failed to parse JSON in ${periodRaw} section:`, err.message);
    }
  }

  return results;
}

/**
 * Split region pair key into alphabetically sorted regions
 * Handles region names that contain underscores (e.g., "middle_east")
 */
function parseRegionPair(pairKey, regionsInStory = []) {
  // Common region names that contain underscores
  const multiWordRegions = ['middle_east', 'south_asia', 'east_se_asia', 'latin_americas'];
  
  // Try to match against known regions from the story
  if (regionsInStory.length > 0) {
    // Convert hyphenated regions to underscored for matching
    const normalizedRegions = regionsInStory.map(r => r.replace(/-/g, '_'));
    
    for (const region of normalizedRegions) {
      if (pairKey.startsWith(region + '_')) {
        const other = pairKey.substring(region.length + 1);
        const sorted = [region, other].sort();
        return {
          region_a: sorted[0],
          region_b: sorted[1]
        };
      }
      if (pairKey.endsWith('_' + region)) {
        const other = pairKey.substring(0, pairKey.length - region.length - 1);
        const sorted = [region, other].sort();
        return {
          region_a: sorted[0],
          region_b: sorted[1]
        };
      }
    }
  }
  
  // Fallback: try to find a multi-word region in the key
  for (const multiWord of multiWordRegions) {
    if (pairKey.includes(multiWord)) {
      const other = pairKey.replace(multiWord + '_', '').replace('_' + multiWord, '');
      const sorted = [multiWord, other].sort();
      return {
        region_a: sorted[0],
        region_b: sorted[1]
      };
    }
  }
  
  // Last resort: split by underscore
  const parts = pairKey.split('_');
  if (parts.length === 2) {
    const sorted = parts.sort();
    return {
      region_a: sorted[0],
      region_b: sorted[1]
    };
  }
  
  console.warn(`⚠️  Could not parse region pair: ${pairKey}`);
  return null;
}

/**
 * Insert PGI scores into Supabase
 */
async function insertPGIScores(scanDate, periodData) {
  let totalScoresInserted = 0;
  let totalPairsInserted = 0;

  for (const { period, scores } of periodData) {
    console.log(`\n📊 Processing ${period.toUpperCase()} scores (${scores.length} stories)...`);

    for (const score of scores) {
      const storyData = {
        story_slug: score.story_slug,
        story_headline: score.story_headline,
        category: score.category,
        regions_covered: score.regions_covered,
        region_count: score.regions_covered.length,
        d1_factual: score.dimensions.d1_factual,
        d2_causal: score.dimensions.d2_causal,
        d3_framing: score.dimensions.d3_framing || score.dimensions.d3_narrative_market,
        d4_emotional: score.dimensions.d4_emotional,
        d5_actor_context: score.dimensions.d5_actor_context || score.dimensions.d5_actor_portrayal,
        d6_cui_bono: score.dimensions.d6_cui_bono || null,
        significance: score.significance,
        scoring_rationale: score.scoring_rationale,
        scan_date: scanDate,
        scan_period: period,
        is_latest: true
      };

      // Upsert story score
      const { data: insertedScore, error: scoreError } = await supabase
        .from('pgi_story_scores')
        .upsert(storyData, {
          onConflict: 'story_slug,scan_date,scan_period',
          ignoreDuplicates: false
        })
        .select('id')
        .single();

      if (scoreError) {
        console.error(`  ❌ Failed to insert score for ${score.story_slug}:`, scoreError.message);
        continue;
      }

      totalScoresInserted++;
      const storyScoreId = insertedScore.id;

      // Insert region pairs
      if (score.region_pairs && typeof score.region_pairs === 'object') {
        const pairEntries = Object.entries(score.region_pairs);
        
        for (const [pairKey, pairScore] of pairEntries) {
          const regions = parseRegionPair(pairKey, score.regions_covered);
          if (!regions) continue;

          const pairData = {
            story_score_id: storyScoreId,
            region_a: regions.region_a,
            region_b: regions.region_b,
            pair_pgi: pairScore,
            scan_date: scanDate
          };

          const { error: pairError } = await supabase
            .from('pgi_region_pairs')
            .upsert(pairData, {
              onConflict: 'story_score_id,region_a,region_b',
              ignoreDuplicates: false
            });

          if (pairError) {
            console.error(`    ❌ Failed to insert pair ${pairKey}:`, pairError.message);
          } else {
            totalPairsInserted++;
          }
        }
      }
    }

    console.log(`  ✅ Inserted ${scores.length} story scores for ${period.toUpperCase()}`);
  }

  return { totalScoresInserted, totalPairsInserted };
}

/**
 * Main execution
 */
async function main() {
  // Get target date
  const dateArg = process.argv[2];
  const scanDate = dateArg || getTodayNZ();
  
  console.log(`🔍 Processing PGI scores for ${scanDate}\n`);

  // Build scan file path
  const scanFilePath = path.join(
    '/Users/treelight/.openclaw/workspace/memory/scans',
    `${scanDate}.md`
  );

  // Parse PGI scores from file
  const periodData = parsePGIScores(scanFilePath);

  if (periodData.length === 0) {
    console.log('ℹ️  No PGI scores found in scan file. This is OK if scans haven\'t run yet.');
    process.exit(0);
  }

  const totalScores = periodData.reduce((sum, p) => sum + p.scores.length, 0);
  console.log(`📈 Found ${totalScores} total scores across ${periodData.length} scan periods`);

  // Insert into Supabase
  const { totalScoresInserted, totalPairsInserted } = await insertPGIScores(scanDate, periodData);

  console.log(`\n✨ Done!`);
  console.log(`   • ${totalScoresInserted} story scores inserted/updated`);
  console.log(`   • ${totalPairsInserted} region pairs inserted/updated`);

  process.exit(0);
}

// Run
main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});

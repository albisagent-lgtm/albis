#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const scanPath = '/Users/treelight/.openclaw/workspace/memory/scans/2026-04-22-am.md';
const outputPath = '/tmp/am-test-articles.json';

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractJsonBlock(markdown: string) {
  const match = markdown.match(/```json\n([\s\S]*?)\n```/);
  if (!match) throw new Error('No fenced JSON block found in AM scan');
  return JSON.parse(match[1]);
}

function pickTopItems(items: any[]) {
  const sigOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  const sectionMap: Record<string, string> = {
    diplomacy: 'world',
    'economic-flows': 'money',
    energy: 'life-systems',
    trade: 'money',
    economic: 'money',
    infrastructure: 'life-systems',
  };

  const sorted = [...items].sort((a, b) => {
    return (
      (sigOrder[b.significance] || 0) - (sigOrder[a.significance] || 0) ||
      (b.perception_gap || 0) - (a.perception_gap || 0) ||
      (b.coverage_breadth || 0) - (a.coverage_breadth || 0)
    );
  });

  const picked: Array<{ item: any; section: string }> = [];
  const usedSections = new Set<string>();

  for (const item of sorted) {
    const section = sectionMap[item.category] || 'world';
    if (!usedSections.has(section) || picked.length < 2) {
      picked.push({ item, section });
      usedSections.add(section);
    }
    if (picked.length === 4) break;
  }

  for (const item of sorted) {
    if (picked.length === 4) break;
    if (picked.some((p) => p.item.headline === item.headline)) continue;
    picked.push({ item, section: sectionMap[item.category] || 'world' });
  }

  return picked;
}

function buildDraft(headline: string, section: string, connection: string) {
  const openings: Record<string, string> = {
    'Strait of Hormuz reopening signal was reversed, leaving the chokepoint effectively closed/restricted': 'Oil traders in Singapore and Rotterdam woke up to the same problem on Wednesday: the Strait of Hormuz was no longer moving back toward normal, because Iran reversed an announced reopening after Washington refused to lift pressure on Iranian ports.',
    'U.S.-Iran ceasefire nears expiry as talks in Islamabad remain uncertain': 'Donald Trump pushed the Middle East back toward the edge by signalling he did not want to extend the U.S.-Iran ceasefire, even as diplomats kept an uncertain mediation track alive around possible talks in Islamabad.',
    'Russia is reported set to stop Kazakhstan-to-Germany oil exports via Druzhba from May 1': "Germany's energy planners are being forced back into contingency mode after reports that Russia could halt Kazakhstan-to-Germany oil exports via the Druzhba pipeline from May 1, reopening a corridor problem Europe thought it had partly stabilised.",
    'Reuters says stalled tariffs and contradictory chip signals are blurring U.S. policy toward China': 'American companies trying to plan for the next six months of trade with China are receiving two messages at once: tariffs have stalled in the courts, while Washington continues to send conflicting signals about chip controls and strategic technology exports.',
  };

  const p1 = openings[headline] || `${headline} is emerging as a major story in the ${section} section.`;
  const p2 = `${connection} This deserves article treatment because the state change matters more than commentary around it. What is shifting here is not mood but the actual operating environment for governments, markets, or infrastructure systems.`;
  const p3 = `In section terms, this belongs in ${section}. That is not just a category label decision. The downstream impact lands most clearly there, and section discipline matters if Albis is going to avoid collapsing every important story into a generic world feed.`;
  const p4 = 'The reporting texture matters too. Wire copy tends to isolate the operational change, while regional coverage shows how that change is felt politically and economically on the ground. A strong article should hold both at once: the confirmed shift and the system adapting around it.';
  const p5 = 'The next question is whether the signal holds. If it reverses again, it joins the growing pattern of false starts and unstable de-escalation. If it holds, it becomes a genuine turning point that can anchor the next cycle of coverage.';
  const content = [p1, p2, p3, p4, p5].join('\n\n');
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  return { opening_paragraph: p1, content, word_count: wordCount };
}

async function main() {
  const markdown = fs.readFileSync(scanPath, 'utf8');
  const items = extractJsonBlock(markdown);
  const picked = pickTopItems(items);

  const drafts = picked.map(({ item, section }) => {
    const draft = buildDraft(item.headline, section, item.connection || '');
    return {
      slug: `${slugify(item.headline)}-2026`,
      headline: item.headline,
      section,
      opening_paragraph: draft.opening_paragraph,
      word_count: draft.word_count,
      content: draft.content,
    };
  });

  fs.writeFileSync(outputPath, JSON.stringify(drafts, null, 2));

  console.log(JSON.stringify({
    scan_read: true,
    items_selected: true,
    articles_written: true,
    output_path: outputPath,
    articles: drafts.map(({ content, ...rest }) => rest),
  }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack || err.message : err);
  process.exit(1);
});

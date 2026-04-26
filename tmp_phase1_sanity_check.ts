import fs from 'fs';
import path from 'path';
import { rankPublicStories, selectPublicStories, suggestPublicArticleCount } from './src/lib/public-story-selection';

type Item = {
  headline: string;
  category: string;
  regions: string[];
  tags: string[];
  patterns: string[];
  significance: string;
  connection: string;
  perception_gap?: number | null;
  coverage_breadth?: number | null;
};

function loadItems(file: string): Item[] {
  const md = fs.readFileSync(file, 'utf8');
  const match = md.match(/```json\s*\n([\s\S]*?)```/);
  if (!match) throw new Error(`No JSON block in ${file}`);
  return JSON.parse(match[1]);
}

function fmt(n: number) {
  return n.toFixed(2);
}

function summarize(file: string) {
  const items = loadItems(file);
  const target = suggestPublicArticleCount(items, 3, 7);
  const ranked = rankPublicStories(items);
  const shortlist = selectPublicStories(items, target, 10);

  const byForm = Object.fromEntries(Object.entries(Object.groupBy(ranked, r => r.articleForm)).map(([k,v]) => [k, (v||[]).length]));
  const shortByForm = Object.fromEntries(Object.entries(Object.groupBy(shortlist, r => r.articleForm)).map(([k,v]) => [k, (v||[]).length]));
  const byLane = Object.fromEntries(Object.entries(Object.groupBy(shortlist, r => r.lane)).map(([k,v]) => [k, (v||[]).length]));
  const byCategory = Object.fromEntries(Object.entries(Object.groupBy(shortlist, r => r.categoryKey)).map(([k,v]) => [k, (v||[]).length]));

  return {
    file: path.basename(file),
    items: items.length,
    target,
    shortlistCount: shortlist.length,
    rankedForms: byForm,
    shortlistForms: shortByForm,
    shortlistLanes: byLane,
    shortlistCategories: byCategory,
    top10: ranked.slice(0, 10).map((r, i) => ({
      rank: i + 1,
      headline: r.item.headline,
      category: r.categoryKey,
      lane: r.lane,
      form: r.articleForm,
      total: fmt(r.score),
      writeability: fmt(r.writeabilityScore),
      specificity: fmt(r.specificity),
      why: r.why.slice(0, 8),
      opportunity: r.articleOpportunity,
      signals: r.articleSignals,
    })),
    shortlist: shortlist.map((r, i) => ({
      pick: i + 1,
      headline: r.item.headline,
      category: r.categoryKey,
      lane: r.lane,
      form: r.articleForm,
      total: fmt(r.score),
      writeability: fmt(r.writeabilityScore),
      specificity: fmt(r.specificity),
      why: r.why.slice(0, 8),
      opportunity: r.articleOpportunity,
      signals: r.articleSignals,
    })),
  };
}

const base = '/Users/treelight/.openclaw/workspace/memory/scans';
const files = ['2026-04-26-am.md', '2026-04-26-pm.md'].map(f => path.join(base, f));
console.log(JSON.stringify(files.map(summarize), null, 2));

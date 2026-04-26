import { rankPublicStories } from './src/lib/public-story-selection';
import type { ScanItemInput } from './src/lib/relevance-engine';

const samples: ScanItemInput[] = [
  {
    headline: 'Oil prices rise as shipping fears grow',
    category: 'economic-flows',
    regions: ['middle-east'],
    tags: ['oil', 'shipping', 'markets'],
    patterns: ['escalation'],
    significance: 'high',
    connection: 'Broader market anxiety persists after new warnings about regional disruption.',
    coverage_breadth: 4,
    perception_gap: 2,
  },
  {
    headline: 'Chad relocates Sudan refugees after border attacks hit aid corridor',
    category: 'migration-demographics',
    regions: ['africa'],
    tags: ['refugee', 'aid', 'border', 'camp'],
    patterns: ['displacement'],
    significance: 'high',
    connection: 'Authorities moved families from camps near the Sudan border after attacks threatened aid convoys and water access in eastern Chad.',
    coverage_breadth: 6,
    perception_gap: 3,
  },
  {
    headline: 'Chile fuel prices jump 54% after buffer breaks',
    category: 'energy',
    regions: ['latin-america'],
    tags: ['fuel', 'prices', 'inflation'],
    patterns: ['price-shock'],
    significance: 'high',
    connection: 'The 54% jump in retail fuel prices exposes how Chile\'s buffer system failed once import costs and freight premiums surged.',
    coverage_breadth: 6,
    perception_gap: 4,
  },
];

const ranked = rankPublicStories(samples).map((entry) => ({
  headline: entry.item.headline,
  form: entry.articleForm,
  writeabilityScore: Number(entry.writeabilityScore.toFixed(2)),
  why: entry.why,
}));

console.log(JSON.stringify(ranked, null, 2));

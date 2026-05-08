import { buildMissingStories, type MissingStory } from './coverage-gap';
import type { ScanItem } from '@/lib/scan-types';

export interface MispricedAttentionStory extends MissingStory {
  whyCandidate: string;
}

export function buildMispricedAttention(items: ScanItem[]): MispricedAttentionStory[] {
  return buildMissingStories(items)
    .map((story) => ({
      ...story,
      whyCandidate: story.missingFrom.length >= 4
        ? 'Visible in today’s Albis coverage map with limited visibility across several major regional lenses.'
        : story.perceptionGap && story.perceptionGap >= 7
          ? 'Visible enough to compare, but the meaning appears to diverge between audiences.'
          : 'Worth watching because the directional signal is stronger than its current coverage breadth.',
    }))
    .slice(0, 10);
}

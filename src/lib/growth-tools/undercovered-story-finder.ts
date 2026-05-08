import { buildMissingStories, type MissingStory } from './coverage-gap';
import type { ScanItem } from '@/lib/scan-types';

export interface UndercoveredStoryFilters {
  region?: string;
  category?: string;
  minSignal?: number;
  highDivergenceOnly?: boolean;
}

export function findUndercoveredStories(items: ScanItem[], filters: UndercoveredStoryFilters = {}): MissingStory[] {
  const minSignal = filters.minSignal ?? 45;
  return buildMissingStories(items, filters.region)
    .filter((story) => !filters.category || story.category === filters.category)
    .filter((story) => story.directionalGapSignal >= minSignal)
    .filter((story) => !filters.highDivergenceOnly || (story.perceptionGap ?? 0) >= 6)
    .slice(0, 20);
}

export const PILLARS = {
  'the-race': {
    name: 'The Race',
    emoji: '🔬',
    description: 'AI geopolitics, autonomous weapons, regulatory divergence, AI employment, and the meta-awareness angle',
    slug: 'the-race'
  },
  'the-flow': {
    name: 'The Flow',
    emoji: '⚡',
    description: 'Energy, trade routes, supply chains, and economic cascades',
    slug: 'the-flow'
  },
  'the-signal': {
    name: 'The Signal',
    emoji: '📡',
    description: 'Information warfare, deepfakes, AI-generated content, platform governance, and framing analysis',
    slug: 'the-signal'
  },
  'the-human-cost': {
    name: 'The Human Cost',
    emoji: '🌍',
    description: 'Humanitarian crises, climate disasters, migration, food security, and women\'s rights',
    slug: 'the-human-cost'
  },
  'the-lens': {
    name: 'The Lens',
    emoji: '🔍',
    description: 'Analysis, opinion, and cross-cutting pieces that help you see the bigger picture',
    slug: 'the-lens'
  },
} as const;

export type PillarSlug = keyof typeof PILLARS;

export type PillarInfo = typeof PILLARS[PillarSlug];

export function getPillarInfo(slug: string): PillarInfo | null {
  return PILLARS[slug as PillarSlug] || null;
}

export function getAllPillars(): Array<{ slug: PillarSlug; info: PillarInfo }> {
  return Object.entries(PILLARS).map(([slug, info]) => ({
    slug: slug as PillarSlug,
    info,
  }));
}
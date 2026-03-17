export const CATEGORIES = {
  'all': 'All',
  'analysis': 'Analysis',
  'perspectives': 'Perspectives',
  'media-literacy': 'Media Literacy',
  'data': 'Data',
  'breaking': 'Breaking',
  'research': 'Research',
} as const;

export type CategorySlug = Exclude<keyof typeof CATEGORIES, 'all'>;

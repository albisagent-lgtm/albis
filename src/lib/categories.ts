export const CATEGORIES = {
  'all': 'All',
  'analysis': 'Analysis',
  'perspectives': 'Perspectives',
  'media-literacy': 'Media Literacy',
  'data': 'Data',
  'breaking': 'Breaking',
} as const;

export type CategorySlug = Exclude<keyof typeof CATEGORIES, 'all'>;

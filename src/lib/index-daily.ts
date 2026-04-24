export const PGI_TRIBUTARIES = [
  { code: 'GP', name: 'Geopolitical', key: 'PGI-GP' },
  { code: 'IW', name: 'Information Warfare', key: 'PGI-IW' },
  { code: 'WR', name: "Women's Rights", key: 'PGI-WR' },
  { code: 'EC', name: 'Economics', key: 'PGI-EC' },
  { code: 'TE', name: 'Technology & Ethics', key: 'PGI-TE' },
  { code: 'HE', name: 'Health & Environment', key: 'PGI-HE' },
  { code: 'CL', name: 'Climate', key: 'PGI-CL' },
] as const;

export const GAI_TRIBUTARIES = [
  { code: 'GP', name: 'Geopolitical', key: 'GAI-GP' },
  { code: 'IW', name: 'Information Warfare', key: 'GAI-IW' },
  { code: 'WR', name: "Women's Rights", key: 'GAI-WR' },
  { code: 'EC', name: 'Economics', key: 'GAI-EC' },
  { code: 'TE', name: 'Technology & Ethics', key: 'GAI-TE' },
  { code: 'HE', name: 'Health & Environment', key: 'GAI-HE' },
  { code: 'CL', name: 'Climate', key: 'GAI-CL' },
] as const;

export function readPgiTributaryValue(categoryPgis: unknown, key: string): number | null {
  if (!categoryPgis || typeof categoryPgis !== 'object') return null;
  const value = (categoryPgis as Record<string, unknown>)[key];
  return typeof value === 'number' ? value : value == null ? null : Number(value);
}

export function readGaiTributaryValue(tributaries: unknown, key: string): number | null {
  if (!tributaries || typeof tributaries !== 'object') return null;
  const entry = (tributaries as Record<string, unknown>)[key];
  if (!entry || typeof entry !== 'object') return null;
  const value = (entry as Record<string, unknown>).gai;
  return typeof value === 'number' ? value : value == null ? null : Number(value);
}

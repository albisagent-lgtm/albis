export const PUBLIC_EDITORIAL_DOCTRINE_VERSION = 'phase6-public-doctrine-v1';

export type PublicDoctrineLane =
  | 'turning-point'
  | 'system-ripple'
  | 'human-fallout'
  | 'framing-battle'
  | 'numbers-reset'
  | 'offbeat-window';

export interface PublicDoctrineLaneSpec {
  id: PublicDoctrineLane;
  label: string;
  editorialRole: string;
  briefingBehavior: string;
  articleBehavior: string;
  preferredSlots: Array<'must-know' | 'underseen' | 'perception-gap' | 'watchpoint'>;
}

export interface PublicDoctrineMixItem {
  lane: PublicDoctrineLane;
  label: string;
  count: number;
  editorialRole: string;
}

export const PUBLIC_EDITORIAL_CONTRACT = {
  version: PUBLIC_EDITORIAL_DOCTRINE_VERSION,
  name: 'Albis public editorial contract',
  principles: [
    'Lead with developments that materially change the operating picture, not just the loudest headline.',
    'Keep the public mix broad enough to show systems, people, framing gaps, numbers, and surprising edge signals in the same edition.',
    'Every public story should deliver a clean walkaway: what changed, what it means, or what larger pattern it reveals.',
    'Use content lanes to shape selection and packaging, but preserve the operational owner path as a separate system.',
  ],
} as const;

export const PUBLIC_DOCTRINE_LANES: Record<PublicDoctrineLane, PublicDoctrineLaneSpec> = {
  'turning-point': {
    id: 'turning-point',
    label: 'Turning point',
    editorialRole: 'State change that alters the baseline readers should use.',
    briefingBehavior: 'Use when the event itself is the clearest hook and the reader mainly needs the consequence quickly.',
    articleBehavior: 'Lead with the shift, then move fast to what became newly possible, risky, or constrained.',
    preferredSlots: ['must-know', 'watchpoint'],
  },
  'system-ripple': {
    id: 'system-ripple',
    label: 'System ripple',
    editorialRole: 'Operational bottleneck, reroute, infrastructure, rules, or price chain changing downstream behaviour.',
    briefingBehavior: 'Carry pieces that explain how a visible event is bending logistics, access, financing, energy, or governance.',
    articleBehavior: 'Treat the mechanism as the engine of the story and trace the ripple into real-world decisions.',
    preferredSlots: ['must-know', 'watchpoint'],
  },
  'human-fallout': {
    id: 'human-fallout',
    label: 'Human fallout',
    editorialRole: 'Show where a broader shift is landing in homes, clinics, schools, work, or local access.',
    briefingBehavior: 'Keep at least one slot grounded in lived consequence so the edition does not become purely abstract or geopolitical.',
    articleBehavior: 'Enter through the pressure point, then widen out to the wider system producing it.',
    preferredSlots: ['must-know', 'underseen'],
  },
  'framing-battle': {
    id: 'framing-battle',
    label: 'Framing battle',
    editorialRole: 'Make visible when the loudest public frame and the underlying operating story are not the same thing.',
    briefingBehavior: 'Use when the reporting divide is itself part of the story and readers need help seeing the mismatch.',
    articleBehavior: 'Compare competing readings without going abstract; show what each frame reveals or hides.',
    preferredSlots: ['must-know', 'perception-gap'],
  },
  'numbers-reset': {
    id: 'numbers-reset',
    label: 'Numbers reset',
    editorialRole: 'Use a metric only when it changes the baseline rather than decorating the headline.',
    briefingBehavior: 'Deploy for stories where the key number tells readers the pressure is now measurable or worsening.',
    articleBehavior: 'Interpret the number, then connect it to planning, pricing, capacity, or risk.',
    preferredSlots: ['must-know', 'watchpoint'],
  },
  'offbeat-window': {
    id: 'offbeat-window',
    label: 'Offbeat window',
    editorialRole: 'Surface a surprising or edge-case signal that reveals a broader pattern earlier than the main cycle does.',
    briefingBehavior: 'Keep one route for curiosity and underseen specificity so the public product stays discoverable, not just dutiful.',
    articleBehavior: 'Start from the unusual concrete detail, then pay it off with the larger pattern.',
    preferredSlots: ['underseen', 'must-know'],
  },
};

export function getPublicDoctrineLaneSpec(lane: PublicDoctrineLane): PublicDoctrineLaneSpec {
  return PUBLIC_DOCTRINE_LANES[lane];
}

export function derivePublicDoctrineLane(input: {
  articleForm?: string | null;
  lane?: string | null;
  category?: string | null;
}): PublicDoctrineLane {
  switch (input.articleForm) {
    case 'framing-map':
      return 'framing-battle';
    case 'human-ground':
      return 'human-fallout';
    case 'numbers-watch':
      return 'numbers-reset';
    case 'system-shift':
      return 'system-ripple';
    case 'offbeat-signal':
      return 'offbeat-window';
    case 'turning-point':
    default:
      return input.lane === 'war-system' ? 'system-ripple' : 'turning-point';
  }
}

export function summarizeDoctrineMix(entries: Array<{ doctrineLane: PublicDoctrineLane }>): PublicDoctrineMixItem[] {
  const counts = new Map<PublicDoctrineLane, number>();
  for (const entry of entries) {
    counts.set(entry.doctrineLane, (counts.get(entry.doctrineLane) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([lane, count]) => {
      const spec = getPublicDoctrineLaneSpec(lane);
      return {
        lane,
        label: spec.label,
        count,
        editorialRole: spec.editorialRole,
      } satisfies PublicDoctrineMixItem;
    });
}

export function describeDoctrineMix(entries: Array<{ doctrineLane: PublicDoctrineLane }>): string {
  const mix = summarizeDoctrineMix(entries);
  if (!mix.length) return 'No doctrine lane mix available yet.';
  return mix
    .map((item) => `${item.label} x${item.count}`)
    .join(' · ');
}

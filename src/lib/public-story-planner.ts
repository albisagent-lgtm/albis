import type { ArticleForm, ArticleSignals } from './public-story-selection';
import { derivePublicDoctrineLane, type PublicDoctrineLane } from './public-editorial-doctrine';

export type StoryKind = PublicDoctrineLane;

export type OpeningMode =
  | 'direct-factual'
  | 'contrast'
  | 'pressure-point'
  | 'number'
  | 'odd-detail'
  | 'human-proximity';

export type MovementPattern =
  | 'direct-turn'
  | 'contrast-turn'
  | 'pressure-turn'
  | 'number-turn'
  | 'human-turn'
  | 'curious-turn';

export interface StoryPlanInput {
  title: string;
  category: string;
  connection: string;
  significance: string;
  lane: string | null;
  articleForm: ArticleForm | null;
  articleOpportunity: string | null;
  articleSignals: ArticleSignals | null;
  primaryRegion: string;
  regions: string[];
  tags: string[];
}

export interface StoryPlan {
  storyKind: StoryKind;
  walkaway: string;
  openingMode: OpeningMode;
  mainTension: string;
  movementPattern: MovementPattern;
  nutGrafPromise: string;
  hardFactsToPreserve: string[];
  whatToAvoid: string[];
  primaryAngle: string;
}

function sentenceCase(value: string | null | undefined): string {
  const text = String(value || '').trim();
  if (!text) return '';
  return text[0].toUpperCase() + text.slice(1);
}

function clean(value: string | null | undefined): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function unique(items: Array<string | null | undefined>): string[] {
  return Array.from(new Set(items.map((item) => clean(item)).filter(Boolean)));
}

function deriveStoryKind(input: StoryPlanInput): StoryKind {
  return derivePublicDoctrineLane({
    articleForm: input.articleForm,
    lane: input.lane,
    category: input.category,
  });
}

function deriveOpeningMode(input: StoryPlanInput, storyKind: StoryKind): OpeningMode {
  const signals = input.articleSignals;
  const mechanism = clean(signals?.mechanism).toLowerCase();

  if (signals?.keyNumber && input.articleForm === 'numbers-watch') return 'number';
  if (storyKind === 'human-fallout' && signals?.humanStake) return 'human-proximity';
  if (storyKind === 'framing-battle') return 'contrast';
  if (storyKind === 'offbeat-window') return 'odd-detail';
  if (
    storyKind === 'system-ripple' ||
    input.lane === 'war-system' ||
    /chokepoint|bottleneck|pressure|price|financing|logistics|access squeeze/.test(mechanism)
  ) {
    return 'pressure-point';
  }
  return 'direct-factual';
}

function deriveMovementPattern(storyKind: StoryKind, openingMode: OpeningMode): MovementPattern {
  if (openingMode === 'contrast') return 'contrast-turn';
  if (openingMode === 'human-proximity') return 'human-turn';
  if (openingMode === 'number') return 'number-turn';
  if (openingMode === 'odd-detail') return 'curious-turn';
  if (openingMode === 'pressure-point') return 'pressure-turn';
  if (storyKind === 'turning-point') return 'direct-turn';
  return 'direct-turn';
}

function deriveMainTension(input: StoryPlanInput, storyKind: StoryKind): string {
  const signals = input.articleSignals;
  if (signals?.framingTension) return sentenceCase(signals.framingTension);
  if (storyKind === 'human-fallout' && signals?.humanStake) {
    return `${sentenceCase(signals.humanStake)} is now colliding with a wider system shift.`;
  }
  if (storyKind === 'numbers-reset' && signals?.keyNumber) {
    return `${signals.keyNumber} is not just a data point; it changes the baseline readers should use.`;
  }
  if (storyKind === 'system-ripple' && signals?.mechanism) {
    return `${sentenceCase(signals.mechanism)} is turning a headline event into a broader operating change.`;
  }
  return sentenceCase(input.connection || input.title || 'The visible event and the practical fallout are now the same story.');
}

function deriveWalkaway(input: StoryPlanInput, storyKind: StoryKind): string {
  const signals = input.articleSignals;
  const coreFact = clean(signals?.coreFact || input.connection || input.title);
  const mechanism = clean(signals?.mechanism);
  const stake = clean(signals?.humanStake);
  const number = clean(signals?.keyNumber);

  switch (storyKind) {
    case 'framing-battle':
      return sentenceCase(`${coreFact} Follow the gap between the public frame and the operating reality.`);
    case 'human-fallout':
      return sentenceCase(`${coreFact} Enter through ${stake || 'lived consequences'} and widen only as the evidence allows.`);
    case 'numbers-reset':
      return sentenceCase(`${coreFact} Use ${number || 'the key metric'} as the hinge of the reported sequence.`);
    case 'system-ripple':
      return sentenceCase(`${coreFact} Show ${mechanism || 'the underlying bottleneck'} through concrete downstream effects.`);
    case 'offbeat-window':
      return sentenceCase(`${coreFact} Let the odd detail open the route into the larger pattern.`);
    case 'turning-point':
    default:
      return sentenceCase(`${coreFact} Lead with the state change and then show what is different on the ground.`);
  }
}

function deriveNutGrafPromise(input: StoryPlanInput, storyKind: StoryKind): string {
  const signals = input.articleSignals;
  switch (storyKind) {
    case 'framing-battle':
      return sentenceCase(`Report what the loudest frame misses through concrete source differences.`);
    case 'human-fallout':
      return sentenceCase(`Connect a concrete human pressure point to the larger system producing it.`);
    case 'numbers-reset':
      return sentenceCase(`Use ${signals?.keyNumber || 'the headline number'} as the metric that changes the reported sequence.`);
    case 'system-ripple':
      return sentenceCase(`Show how ${signals?.mechanism || 'the operative bottleneck'} turns one event into wider ripple effects.`);
    case 'offbeat-window':
      return sentenceCase(`Use an unusual detail as the cleanest route into the larger pattern.`);
    case 'turning-point':
    default:
      return sentenceCase(`Make clear what changed, what is verified, and what happens next.`);
  }
}

function derivePrimaryAngle(input: StoryPlanInput, storyKind: StoryKind): string {
  const signals = input.articleSignals;
  switch (storyKind) {
    case 'framing-battle':
      return 'Use the mismatch between surface story and underlying story as the main route.';
    case 'human-fallout':
      return `Enter through ${signals?.primaryLocation || input.primaryRegion || 'the pressure point'} and widen outward.`;
    case 'numbers-reset':
      return `Treat ${signals?.keyNumber || 'the operative number'} as the hinge, not a decoration.`;
    case 'system-ripple':
      return `Treat ${signals?.mechanism || 'the bottleneck'} as the engine of the piece.`;
    case 'offbeat-window':
      return 'Use the surprising concrete detail to reveal the bigger pattern.';
    case 'turning-point':
    default:
      return 'Lead with the state change itself, then turn quickly to consequence.';
  }
}

function deriveHardFactsToPreserve(input: StoryPlanInput): string[] {
  const signals = input.articleSignals;
  return unique([
    input.title,
    signals?.coreFact,
    signals?.keyNumber,
    ...(signals?.mainActors || []),
    signals?.primaryLocation,
    signals?.humanStake,
    signals?.mechanism,
    signals?.framingTension,
    input.connection,
  ]).slice(0, 8);
}

function deriveWhatToAvoid(input: StoryPlanInput, openingMode: OpeningMode): string[] {
  const avoid = [
    'headline paraphrase as opening',
    'paragraphs that announce their function instead of advancing the story',
    'generic significance language without a concrete anchor',
    'this-is-why-it-matters language instead of reported sequence',
    'dropping the mechanism or human stake after the opening',
  ];

  if (openingMode !== 'number') avoid.push('forcing a metric-led opening when the number is not the hook');
  if (openingMode !== 'human-proximity') avoid.push('inventing anecdotal colour that the scan does not support');
  if (input.articleForm !== 'framing-map') avoid.push('overplaying frame language when the real strength is operational');

  return avoid;
}

export function buildStoryPlan(input: StoryPlanInput): StoryPlan {
  const storyKind = deriveStoryKind(input);
  const openingMode = deriveOpeningMode(input, storyKind);
  return {
    storyKind,
    walkaway: deriveWalkaway(input, storyKind),
    openingMode,
    mainTension: deriveMainTension(input, storyKind),
    movementPattern: deriveMovementPattern(storyKind, openingMode),
    nutGrafPromise: deriveNutGrafPromise(input, storyKind),
    hardFactsToPreserve: deriveHardFactsToPreserve(input),
    whatToAvoid: deriveWhatToAvoid(input, openingMode),
    primaryAngle: derivePrimaryAngle(input, storyKind),
  };
}

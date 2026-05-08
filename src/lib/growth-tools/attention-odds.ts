import { buildMispricedAttention, type MispricedAttentionStory } from './mispriced-attention';
import type { ScanItem } from '@/lib/scan-types';

export interface AttentionOddsStory extends MispricedAttentionStory {
  attentionSignal: number;
  signalLabel: string;
  forecastWindow: string;
  confirmSignals: string[];
  denySignals: string[];
}

function label(signal: number) {
  if (signal >= 75) return 'High under-attention signal';
  if (signal >= 58) return 'Rising watch signal';
  return 'Early watch signal';
}

export function buildAttentionOddsBoard(items: ScanItem[]): AttentionOddsStory[] {
  return buildMispricedAttention(items)
    .map((story) => {
      const pgiBoost = story.perceptionGap ? Math.min(16, story.perceptionGap * 1.8) : 0;
      const missingBoost = Math.min(18, story.missingFrom.length * 3);
      const attentionSignal = Math.max(1, Math.min(95, Math.round(story.directionalGapSignal * 0.72 + pgiBoost + missingBoost)));
      return {
        ...story,
        attentionSignal,
        signalLabel: label(attentionSignal),
        forecastWindow: 'Next 7 days',
        confirmSignals: [
          'More regions begin covering the same story or adjacent consequences.',
          'Follow-on reporting connects the story to trade, policy, security, health, or daily-life impacts.',
          'PGI/GAI signals remain elevated after the next scan cycle.',
        ],
        denySignals: [
          'The story stays local with no wider follow-through.',
          'Later reporting shows the detected signal was isolated or overstated.',
          'Coverage broadens without meaningful divergence or real-world consequence.',
        ],
      };
    })
    .sort((a, b) => b.attentionSignal - a.attentionSignal)
    .slice(0, 10);
}

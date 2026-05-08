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
    .map((story, index) => {
      const pgiBoost = story.perceptionGap ? Math.min(12, story.perceptionGap * 1.2) : 0;
      const missingBoost = Math.min(20, story.missingFrom.length * 2.2);
      const breadthPenalty = Math.min(14, (story.coverageBreadth ?? 0) * 1.4);
      const rankTaper = Math.min(10, index * 1.5);
      const attentionSignal = Math.max(
        34,
        Math.min(89, Math.round(story.directionalGapSignal * 0.42 + pgiBoost + missingBoost - breadthPenalty - rankTaper)),
      );
      return {
        ...story,
        attentionSignal,
        signalLabel: label(attentionSignal),
        forecastWindow: 'Next 7 days',
        confirmSignals: [
          'More regions begin covering the same story or adjacent consequences.',
          'Follow-on reporting connects the story to trade, policy, security, health, or daily-life impacts.',
          'PGI/GAI signals remain elevated after the next Albis update.'
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

import type { AngleCandidate } from './types';

export function selectMainAngle(candidates: AngleCandidate[]): AngleCandidate | null {
  if (!candidates.length) return null;
  return [...candidates].sort((a, b) => b.scores.total - a.scores.total)[0];
}

export function buildPublicHook(candidate: AngleCandidate | null): string {
  if (!candidate) return 'What your feed missed today.';
  return `This may be one of today’s mispriced attention stories: ${candidate.title}`;
}

export function buildBusinessHook(candidate: AngleCandidate | null): string {
  if (!candidate) return 'Narrative risk often appears first as scattered coverage before it becomes a boardroom question.';
  return `For PR, public affairs, and strategy teams: the risk is not just what happened, but how different audiences start framing it.`;
}

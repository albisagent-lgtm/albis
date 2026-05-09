export type GrowthDeskChannel = 'x' | 'telegram' | 'linkedin' | 'carousel' | 'founder_video' | 'reddit' | 'email';

export interface AngleCandidate {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
  url: string;
  contentPreview: string;
  tags: string[];
  scores: {
    uniqueness: number;
    coverageGap: number;
    businessRelevance: number;
    publicHook: number;
    founderRecordability: number;
    risk: number;
    total: number;
  };
  reasons: string[];
}

export interface LinkVerification {
  url: string;
  ok: boolean;
  status?: number;
  titleMatched?: boolean;
  contentMatched?: boolean;
  reason?: string;
}

export interface ChannelDraft {
  channel: GrowthDeskChannel;
  title: string;
  body: string;
  url?: string;
  characterCount?: number;
  qaStatus: 'pass' | 'warn' | 'fail';
  notes: string[];
}

export interface QAGateResult {
  status: 'pass' | 'warn' | 'fail';
  checks: Array<{ name: string; status: 'pass' | 'warn' | 'fail'; message: string }>;
}

export interface MetricsSnapshot {
  subscribers?: number;
  companyProfiles?: number;
  notes: string[];
}

export interface SocialDayPack {
  date: string;
  frame: 'Mispriced Attention';
  mainAngle: AngleCandidate | null;
  linkVerification?: LinkVerification;
  publicHook: string;
  businessHook: string;
  cta: string;
  drafts: ChannelDraft[];
  qa: QAGateResult;
  metrics: MetricsSnapshot;
  generatedAt: string;
}

export interface GrowthDeskInputs {
  date: string;
  candidates: AngleCandidate[];
  metrics: MetricsSnapshot;
}

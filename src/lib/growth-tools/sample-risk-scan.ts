export type SampleScanProfile = 'pr' | 'logistics' | 'public-affairs' | 'research';

export interface SampleRiskSignal {
  label: string;
  title: string;
  whyItMatters: string;
  coverageGap: string;
  nextWatch: string;
}

export interface SampleRiskScan {
  profile: SampleScanProfile;
  audience: string;
  headline: string;
  promise: string;
  signals: SampleRiskSignal[];
  pilotFit: string;
  evidencePattern: string;
}

const scans: Record<SampleScanProfile, SampleRiskScan> = {
  pr: {
    profile: 'pr',
    audience: 'PR, crisis, and reputation teams',
    headline: 'Narrative-risk sample for a reputation team',
    promise: 'A private daily scan that catches how a client, sector, or issue is being framed before it becomes the next call you have to answer.',
    pilotFit: 'Best for boutique PR, crisis, reputation, and public affairs teams managing several clients or sensitive sectors.',
    evidencePattern: 'Local reporting + regulator language + advocacy or trade-body statements + regional pickup.',
    signals: [
      {
        label: 'Reputation',
        title: 'Local criticism starts crossing into regional coverage',
        whyItMatters: 'A story that begins locally can become a client issue once regional outlets repeat the same frame. The useful signal is the movement between audiences, not the first headline.',
        coverageGap: 'Local sources are treating the issue as accountability; wider English-language coverage is still treating it as an operational update.',
        nextWatch: 'Watch whether advocacy groups, regulators, or trade outlets repeat the accountability frame over the next 48 hours.',
      },
      {
        label: 'Policy pressure',
        title: 'Regulatory language hardens before formal action',
        whyItMatters: 'Clients often hear about policy risk after the language has already shifted. Early wording changes can help teams prepare holding lines and board notes.',
        coverageGap: 'Domestic policy outlets are using stronger terms than international business wires.',
        nextWatch: 'Look for the same wording in ministry briefings, parliamentary questions, and industry association statements.',
      },
      {
        label: 'Stakeholder map',
        title: 'A quiet technical issue becomes a values story',
        whyItMatters: 'Reputation risk often grows when a technical issue becomes a proxy for safety, fairness, or trust.',
        coverageGap: 'Trade coverage focuses on process; civic and regional coverage focuses on who pays the cost.',
        nextWatch: 'Watch for human-impact stories, petition language, and opposition-party amplification.',
      },
    ],
  },
  logistics: {
    profile: 'logistics',
    audience: 'logistics, customs, and supply-chain teams',
    headline: 'Narrative-risk sample for a logistics advisory team',
    promise: 'A private daily scan that spots route, port, regulation, labour, weather, and geopolitical signals before they become a dashboard incident.',
    pilotFit: 'Best for logistics operators, customs brokers, route planners, supply-chain advisors, and trade-risk teams.',
    evidencePattern: 'Local port/labour reporting + customs notices + trade association bulletins + shipping or insurance commentary.',
    signals: [
      {
        label: 'Route fragility',
        title: 'Port disruption appears first in local labour coverage',
        whyItMatters: 'The earliest useful warning may not be a shipping-price headline. It may be local labour reporting that shows where delays could widen.',
        coverageGap: 'Local outlets focus on worker action and customs queues; international coverage is still focused on freight rates.',
        nextWatch: 'Watch for secondary port diversion, customs bulletin changes, and trade association alerts.',
      },
      {
        label: 'Regulation',
        title: 'New inspection language emerges around a trade lane',
        whyItMatters: 'Inspection wording can harden quickly into practical delays for importers, even before formal guidance is widely circulated.',
        coverageGap: 'Domestic sources are using compliance language while global outlets have not picked up the operational impact.',
        nextWatch: 'Track customs notices, exporter forums, and logistics bulletins for repeat language.',
      },
      {
        label: 'Geopolitics',
        title: 'Sanctions-adjacent coverage starts naming intermediaries',
        whyItMatters: 'Even without a new sanctions list, repeated naming of intermediaries can alter insurer, bank, and freight behaviour.',
        coverageGap: 'Regional political coverage is sharper than mainstream market coverage.',
        nextWatch: 'Watch banks, insurers, shipping registries, and port authorities for practical follow-through.',
      },
    ],
  },
  'public-affairs': {
    profile: 'public-affairs',
    audience: 'public affairs and strategic communications teams',
    headline: 'Narrative-risk sample for a public affairs team',
    promise: 'A private daily scan that tracks how policy stories are forming across regions, institutions, and political audiences.',
    pilotFit: 'Best for public affairs, policy, strategic communications, and advisory teams watching regulatory or political issues.',
    evidencePattern: 'Official wording + local political coverage + committee/hearing activity + sector or civil-society response.',
    signals: [
      {
        label: 'Policy narrative',
        title: 'A technical rule starts being framed as household cost',
        whyItMatters: 'Policy risk increases when technical changes become emotionally legible to voters, customers, or opposition parties.',
        coverageGap: 'Specialist outlets focus on implementation; local political coverage focuses on who is affected.',
        nextWatch: 'Watch parliamentary questions, consumer groups, and local radio framing.',
      },
      {
        label: 'Regional split',
        title: 'The same proposal is sold as security in one region and cost in another',
        whyItMatters: 'Different frames create different pressure points for communications and stakeholder engagement.',
        coverageGap: 'Security framing dominates regional outlets; fiscal framing dominates business outlets.',
        nextWatch: 'Track which frame appears in official speeches and campaign material.',
      },
      {
        label: 'Coalition signal',
        title: 'Unusual groups begin using the same language',
        whyItMatters: 'When groups that do not usually align start repeating the same phrase, an issue can move faster than expected.',
        coverageGap: 'The alignment is visible in local and sector-specific sources before national coverage connects it.',
        nextWatch: 'Watch joint letters, hearings, and NGO/trade-body statements.',
      },
    ],
  },
  research: {
    profile: 'research',
    audience: 'research and intelligence teams',
    headline: 'Narrative-risk sample for a research team',
    promise: 'A private daily scan that reduces source-checking time and highlights what coverage is missing or diverging across regions.',
    pilotFit: 'Best for small research, strategy, market intelligence, and advisory teams that need a faster global read.',
    evidencePattern: 'Regional coverage + specialist sources + institutional references + repeat framing across independent outlets.',
    signals: [
      {
        label: 'Information gap',
        title: 'A major regional story is absent from most global feeds',
        whyItMatters: 'Absence is itself a signal. Teams can miss early shifts when the story is important locally but not yet visible internationally.',
        coverageGap: 'Regional outlets cover the story as material; US/UK feeds barely surface it.',
        nextWatch: 'Watch whether specialist newsletters, NGOs, or regional institutions amplify it first.',
      },
      {
        label: 'Frame divergence',
        title: 'Sources agree on the event but disagree on what it means',
        whyItMatters: 'Research teams need the meaning layer, not just the event layer. Divergence can show where policy or market assumptions differ.',
        coverageGap: 'One region frames it as risk; another frames it as opportunity.',
        nextWatch: 'Track which frame gets repeated in official, investor, and trade commentary.',
      },
      {
        label: 'Early weak signal',
        title: 'Small sources begin clustering around the same concern',
        whyItMatters: 'Early clusters can be noisy, but they are worth watching when several independent sources begin describing the same friction.',
        coverageGap: 'Specialist and regional sources are active; mainstream coverage is absent.',
        nextWatch: 'Watch whether the cluster gains institutional sources or remains local noise.',
      },
    ],
  },
};

export const sampleRiskProfiles = Object.values(scans);

export function getSampleRiskScan(profile: SampleScanProfile): SampleRiskScan {
  return scans[profile] || scans.pr;
}

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Glossary | Albis',
  description: 'Key terms and concepts in media analysis, perception gaps, and information warfare.',
}

interface Term {
  id: string
  term: string
  definition: string
}

const terms: Term[] = [
  {
    id: 'perception-gap-index',
    term: 'Perception Gap Index',
    definition: 'A quantitative measure (0-10) of how differently the same news story is framed across global media regions. Higher scores indicate greater divergence in narrative, emphasis, or interpretation between regions covering the same event.'
  },
  {
    id: 'pgi-tributaries',
    term: 'PGI Tributaries',
    definition: 'The six dimensional measurements that feed into the overall Perception Gap Index: Geopolitical (GP), Information Warfare (IW), Women\'s Rights (WR), Economics (EC), Technology & Ethics (TE), Health & Environment (HE), and Climate (CL). Each tributary scores a specific aspect of how media coverage diverges across regions.'
  },
  {
    id: 'media-framing',
    term: 'Media Framing',
    definition: 'The way journalists and editors choose to present information by emphasizing certain aspects while downplaying others. Framing determines which facts appear in headlines, which actors are named first, and what causal explanations are offered for events.'
  },
  {
    id: 'narrative-divergence',
    term: 'Narrative Divergence',
    definition: 'The phenomenon where media outlets in different regions tell fundamentally different stories about the same event, not by reporting different facts, but by selecting, emphasizing, and interpreting facts in incompatible ways. High narrative divergence indicates contested or polarized global understanding.'
  },
  {
    id: 'information-warfare',
    term: 'Information Warfare',
    definition: 'The strategic use of information and media to shape perceptions, influence populations, and achieve political or military objectives. Includes tactics like propaganda, disinformation campaigns, censorship, and narrative coordination across state-controlled or state-aligned media.'
  },
  {
    id: 'framing-bias',
    term: 'Framing Bias',
    definition: 'The systematic tendency of media outlets to present events from a particular ideological, national, or cultural perspective. Unlike factual bias (reporting untrue information), framing bias operates through selective emphasis, word choice, and contextual interpretation.'
  },
  {
    id: 'perception-gap',
    term: 'Perception Gap',
    definition: 'The measurable difference in how populations in different regions understand the same global event, driven by divergent media coverage. Perception gaps can persist even when populations have access to the same underlying facts.'
  },
  {
    id: 'editorial-lens',
    term: 'Editorial Lens',
    definition: 'The implicit worldview, assumptions, and priorities that shape how a news organization selects and presents stories. Editorial lenses are often invisible to audiences within the same media ecosystem but become apparent when comparing coverage across regions.'
  },
  {
    id: 'cui-bono',
    term: 'Cui Bono',
    definition: 'Latin for "who benefits." A critical question in media analysis: whose interests are served by a particular framing or narrative. Asking cui bono reveals the political, economic, or ideological stakes behind how a story is told.'
  },
  {
    id: 'global-attention-index',
    term: 'Global Attention Index (GAI)',
    definition: 'A 1-10 score measuring how unevenly a news story\'s coverage is distributed across regions. Higher scores mean more regions are blind to the story. While the PGI measures how differently regions frame a story, the GAI measures whether they see it at all.'
  },
  {
    id: 'coverage-breadth',
    term: 'Coverage Breadth',
    definition: 'The number of world regions that cover a particular story. A key dimension (D1) of the Global Attention Index. Stories covered by all regions have high breadth; stories covered by only one or two regions have low breadth and high GAI scores.'
  },
  {
    id: 'information-shadow',
    term: 'Information Shadow',
    definition: 'A GAI tier (6.1-8.0) indicating most regions are blind to a story. Stories in the Information Shadow are covered by only a few regions while the majority of the world has no awareness they exist.'
  },
  {
    id: 'attention-desert',
    term: 'Attention Desert',
    definition: 'The highest GAI tier (8.1-10), or the category/tributary with the highest GAI score, meaning the least visible stories. An Attention Desert represents near-total global blindness to a news event.'
  },
]

export default function GlossaryPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': terms.map(({ term, definition }) => ({
      '@type': 'DefinedTerm',
      '@id': `https://www.albis.news/glossary#${term.toLowerCase().replace(/\s+/g, '-')}`,
      name: term,
      description: definition,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <header className="mb-12">
            <h1 className="text-4xl font-bold text-[#0f0f0f] dark:text-[#f0efec] mb-4">
              Glossary
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Key terms and concepts in media analysis, perception gaps, and information warfare.
            </p>
          </header>

          <div className="space-y-8">
            {terms.map(({ id, term, definition }) => (
              <div key={id} id={id} className="scroll-mt-20">
                <h2 className="text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] mb-2">
                  {term}
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {definition}
                </p>
              </div>
            ))}
          </div>

          <footer className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              These definitions reflect Albis methodology and may differ from usage in other contexts.
              For questions about our approach, contact{' '}
              <a href="mailto:harry@albis.news" className="text-[#0f0f0f] dark:text-[#f0efec] underline">
                harry@albis.news
              </a>
            </p>
          </footer>
        </div>
      </div>
    </>
  )
}

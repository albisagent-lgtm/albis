import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'PGI Data | Albis',
  description: 'Current Perception Gap Index scores, tributary readings, and most divergent region pairs.',
  openGraph: {
    title: 'Perception Gap Index Data',
    description: 'Live PGI scores measuring how differently global media frames the same stories.',
  },
}

export const dynamic = 'force-dynamic'

interface DailyPGI {
  date: string
  daily_pgi: number
  pgi_gp: number | null
  pgi_iw: number | null
  pgi_wr: number | null
  pgi_ec: number | null
  pgi_te: number | null
  pgi_he: number | null
  pgi_cl: number | null
}

interface StoryScore {
  story_headline: string
  story_pgi: number
  category: string
  regions_covered: string[]
  scan_date: string
}

interface RegionPair {
  region_a: string
  region_b: string
  pair_pgi: number
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getTierLabel(pgi: number): string {
  if (pgi <= 2) return 'Global Consensus'
  if (pgi <= 4) return 'Different Lenses'
  if (pgi <= 6) return 'Diverging Narratives'
  if (pgi <= 8) return 'Competing Realities'
  return 'Parallel Universes'
}

export default async function PGIDataPage() {
  const supabase = await createClient()

  const { data: dailyData } = await supabase
    .from('pgi_daily')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .single()

  const daily: DailyPGI | null = dailyData

  const { data: storiesData } = await supabase
    .from('pgi_story_scores')
    .select('story_headline, story_pgi, category, regions_covered, scan_date')
    .gte('scan_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('story_pgi', { ascending: false })
    .limit(10)

  const stories: StoryScore[] = storiesData || []

  const { data: pairsData } = await supabase
    .from('pgi_region_pairs')
    .select('region_a, region_b, pair_pgi')
    .gte('scan_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('pair_pgi', { ascending: false })
    .limit(10)

  const pairs: RegionPair[] = pairsData || []

  const tributaries = [
    { code: 'GP', name: 'Geopolitical', value: daily?.pgi_gp },
    { code: 'IW', name: 'Information Warfare', value: daily?.pgi_iw },
    { code: 'WR', name: "Women's Rights", value: daily?.pgi_wr },
    { code: 'EC', name: 'Economics', value: daily?.pgi_ec },
    { code: 'TE', name: 'Technology & Ethics', value: daily?.pgi_te },
    { code: 'HE', name: 'Health & Environment', value: daily?.pgi_he },
    { code: 'CL', name: 'Climate', value: daily?.pgi_cl },
  ]

  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-12">
          <Link
            href="/indexes/pgi"
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:text-zinc-300 mb-4 inline-block"
          >
            ← Back to PGI Overview
          </Link>
          <h1 className="text-4xl font-bold text-[#0f0f0f] dark:text-[#f0efec] mb-4">
            Perception Gap Index Data
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Current PGI scores measuring how differently global media frames the same stories.
          </p>
        </header>

        {daily && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] mb-4">
              Current Daily Score
            </h2>
            <div className="bg-[#f8f7f4] dark:bg-[#0f0f0f] rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-baseline gap-4 mb-2">
                <div className="text-5xl font-bold text-[#0f0f0f] dark:text-[#f0efec]">
                  {daily.daily_pgi.toFixed(1)}
                </div>
                <div className="text-lg text-zinc-600 dark:text-zinc-400">
                  {getTierLabel(daily.daily_pgi)}
                </div>
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                {formatDate(daily.date)}
              </div>
            </div>
          </section>
        )}

        {daily && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] mb-4">
              PGI Tributaries
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              The seven tributary measurements that feed into the overall Perception Gap Index.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tributaries.map((tributary) => (
                <div
                  key={tributary.code}
                  className="bg-white rounded-lg p-4 border border-zinc-200 dark:border-zinc-800"
                >
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        PGI-{tributary.code}
                      </div>
                      <div className="text-lg text-[#0f0f0f] dark:text-[#f0efec]">
                        {tributary.name}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-[#0f0f0f] dark:text-[#f0efec]">
                      {tributary.value !== null && tributary.value !== undefined ? tributary.value.toFixed(1) : '\u2014'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {stories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] mb-4">
              Top Scored Stories (Past 7 Days)
            </h2>
            <div className="space-y-4">
              {stories.map((story, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg p-4 border border-zinc-200 dark:border-zinc-800"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-[#0f0f0f] dark:text-[#f0efec] mb-1">
                        {story.story_headline}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                        <span>{story.category}</span>
                        <span>•</span>
                        <span>{story.regions_covered.length} regions</span>
                        <span>•</span>
                        <span>{formatDate(story.scan_date)}</span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-[#0f0f0f] dark:text-[#f0efec]">
                      {story.story_pgi.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {pairs.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] mb-4">
              Most Divergent Region Pairs (Past 7 Days)
            </h2>
            <div className="space-y-3">
              {pairs.map((pair, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg p-4 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between"
                >
                  <div className="text-[#0f0f0f] dark:text-[#f0efec]">
                    {pair.region_a} ↔ {pair.region_b}
                  </div>
                  <div className="text-xl font-bold text-[#0f0f0f] dark:text-[#f0efec]">
                    {pair.pair_pgi.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            The Perception Gap Index measures how differently global media regions frame the same news stories.
            Scores range from 0 (identical framing) to 10 (completely divergent narratives).
            Data updated three times daily.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4">
            For methodology questions: <a href="mailto:harry@albis.news" className="text-[#0f0f0f] dark:text-[#f0efec] underline">harry@albis.news</a>
          </p>
        </footer>
      </div>
    </div>
  )
}

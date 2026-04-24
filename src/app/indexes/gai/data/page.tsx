import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { GAI_TRIBUTARIES, readGaiTributaryValue } from '@/lib/index-daily'

export const metadata: Metadata = {
  title: 'GAI Data | Albis',
  description: 'Current Global Attention Index scores, tributary readings, and region blindness data.',
  openGraph: {
    title: 'Global Attention Index Data',
    description: 'Live GAI scores measuring how unevenly global news coverage is distributed.',
  },
}

export const revalidate = 3600

interface DailyGAI {
  date: string
  daily_gai: number
  tributaries?: Record<string, { gai: number | null; tier: string; story_count: number; most_invisible: string | null }> | null
}

interface GAIStory {
  story_headline: string
  story_gai: number
  category: string
  regions_found: string[]
  regions_absent: string[]
  coverage_breadth: number
  d1_coverage_breadth: number
  d2_prominence_disparity: number
  d3_population_exposure: number
  d4_significance_severity: number
  scan_date: string
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getTierLabel(gai: number): string {
  if (gai <= 2) return 'Global Spotlight'
  if (gai <= 4) return 'Broad Awareness'
  if (gai <= 6) return 'Selective Attention'
  if (gai <= 8) return 'Information Shadow'
  return 'Attention Desert'
}

export default async function GAIDataPage() {
  const supabase = await createClient()

  const { data: dailyData } = await supabase
    .from('gai_daily')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .single()

  const daily: DailyGAI | null = dailyData

  const { data: storiesData } = await supabase
    .from('gai_story_scores')
    .select('story_headline, story_gai, category, regions_found, regions_absent, coverage_breadth, d1_coverage_breadth, d2_prominence_disparity, d3_population_exposure, d4_significance_severity, scan_date')
    .gte('scan_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('story_gai', { ascending: false })
    .limit(15)

  const stories: GAIStory[] = storiesData || []

  const tributaries = GAI_TRIBUTARIES.map((t) => ({
    code: t.code,
    name: t.name,
    value: readGaiTributaryValue(daily?.tributaries, t.key),
  }))

  // Compute region blindness from stories
  const regionBlindness: Record<string, number> = {}
  for (const s of stories) {
    if (s.regions_absent) {
      for (const r of s.regions_absent) {
        regionBlindness[r] = (regionBlindness[r] || 0) + 1
      }
    }
  }
  const blindnessRanked = Object.entries(regionBlindness)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-12">
          <Link
            href="/indexes/gai"
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:text-zinc-300 mb-4 inline-block"
          >
            ← Back to GAI Overview
          </Link>
          <h1 className="text-4xl font-bold text-[#0f0f0f] dark:text-[#f0efec] mb-4">
            Global Attention Index Data
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Current GAI scores measuring how unevenly global news coverage is distributed across regions.
          </p>
        </header>

        {daily ? (
          <>
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] mb-4">
                Current Daily Score
              </h2>
              <div className="bg-[#f8f7f4] dark:bg-[#0f0f0f] rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-baseline gap-4 mb-2">
                  <div className="text-5xl font-bold text-[#0f0f0f] dark:text-[#f0efec]">
                    {daily.daily_gai.toFixed(1)}
                  </div>
                  <div className="text-lg text-zinc-600 dark:text-zinc-400">
                    {getTierLabel(daily.daily_gai)}
                  </div>
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  {formatDate(daily.date)}
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] mb-4">
                GAI Tributaries
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Seven tributary measurements showing attention blindness by news category.
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
                          GAI-{tributary.code}
                        </div>
                        <div className="text-lg text-[#0f0f0f] dark:text-[#f0efec]">
                          {tributary.name}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-[#0f0f0f] dark:text-[#f0efec]">
                        {tributary.value !== null && tributary.value !== undefined
                          ? tributary.value.toFixed(1)
                          : '\u2014'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="mb-12">
            <div className="bg-[#f8f7f4] dark:bg-[#0f0f0f] rounded-lg p-8 border border-zinc-200 dark:border-zinc-800 text-center">
              <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
                First GAI readings coming soon
              </p>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Data collection begins today. Scores will appear here once calculated.
              </p>
            </div>
          </section>
        )}

        {stories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] mb-4">
              Top Stories by Invisibility (Past 7 Days)
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
                      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                        <span>{story.category}</span>
                        <span>•</span>
                        <span>{story.coverage_breadth} regions covering</span>
                        <span>•</span>
                        <span>{formatDate(story.scan_date)}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <span>D1 Breadth: {story.d1_coverage_breadth?.toFixed(1) ?? '\u2014'}</span>
                        <span>D2 Prominence: {story.d2_prominence_disparity?.toFixed(1) ?? '\u2014'}</span>
                        <span>D3 Exposure: {story.d3_population_exposure?.toFixed(1) ?? '\u2014'}</span>
                        <span>D4 Severity: {story.d4_significance_severity?.toFixed(1) ?? '\u2014'}</span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-[#0f0f0f] dark:text-[#f0efec]">
                      {story.story_gai.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {blindnessRanked.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] mb-4">
              Region Blindness
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              How many stories each region missed in the past 7 days.
            </p>
            <div className="space-y-3">
              {blindnessRanked.map((r) => (
                <div
                  key={r.region}
                  className="bg-white rounded-lg p-4 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between"
                >
                  <div className="text-[#0f0f0f] dark:text-[#f0efec]">{r.region}</div>
                  <div className="text-lg font-bold text-[#0f0f0f] dark:text-[#f0efec]">
                    {r.count} stories missed
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            The Global Attention Index measures how unevenly news coverage is distributed across regions.
            Scores range from 0 (global spotlight) to 10 (attention desert).
            Higher scores indicate more regions are blind to a story.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4">
            For methodology questions: <a href="mailto:harry@albis.news" className="text-[#0f0f0f] dark:text-[#f0efec] underline">harry@albis.news</a>
          </p>
        </footer>
      </div>
    </div>
  )
}

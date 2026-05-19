'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { getSampleRiskScan, sampleRiskProfiles, type SampleScanProfile } from '@/lib/growth-tools/sample-risk-scan';

const demoHref =
  'mailto:harry@albis.news?subject=Company%20Daily%20Scan%20demo&body=Hi%20Harry%2C%0A%0AI%27d%20like%20to%20book%20a%20Company%20Daily%20Scan%20demo.%0A%0ACompany%2Fteam%3A%0AWhat%20we%20track%3A%0AUseful%20times%3A%0A';

export default function FreeCompanyScanClient() {
  const [profile, setProfile] = useState<SampleScanProfile>('pr');
  const scan = useMemo(() => getSampleRiskScan(profile), [profile]);

  return (
    <div className="rounded-3xl border border-black/[0.08] bg-white p-5 shadow-[0_18px_60px_rgb(0,0,0,0.08)] dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none">
      <div className="grid gap-3 sm:grid-cols-2">
        {sampleRiskProfiles.map((item) => (
          <button
            key={item.profile}
            type="button"
            onClick={() => setProfile(item.profile)}
            className={`rounded-2xl border p-4 text-left transition ${profile === item.profile ? 'border-[#c8922a] bg-[#c8922a]/10' : 'border-black/[0.08] hover:border-[#c8922a]/40 dark:border-white/[0.1]'}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c8922a]">Sample</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.audience}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-[#c8922a]/20 bg-[#f8f7f4] p-5 dark:bg-[#101010]">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c8922a]">Illustrative preview</p>
        <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight">{scan.headline}</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{scan.promise}</p>
        <p className="mt-3 rounded-xl bg-white p-3 text-xs leading-relaxed text-zinc-500 dark:bg-white/[0.05] dark:text-zinc-400">
          These examples show the kind of evidence pattern Albis looks for. They are not live findings and should not be treated as advice.
        </p>

        <div className="mt-5 space-y-4">
          {scan.signals.map((signal, index) => (
            <article key={signal.title} className="border-t border-black/[0.07] pt-4 dark:border-white/[0.08]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">{String(index + 1).padStart(2, '0')} · {signal.label}</p>
              <h3 className="mt-1 font-[family-name:var(--font-playfair)] text-lg font-semibold leading-snug">{signal.title}</h3>
              <div className="mt-3 grid gap-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 md:grid-cols-3">
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">Why it matters</p>
                  <p className="mt-1">{signal.whyItMatters}</p>
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">Coverage gap</p>
                  <p className="mt-1">{signal.coverageGap}</p>
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">Watch next</p>
                  <p className="mt-1">{signal.nextWatch}</p>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-black/[0.06] p-3 text-xs leading-relaxed text-zinc-500 dark:border-white/[0.07] dark:text-zinc-400">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Example evidence pattern:</span> {scan.evidencePattern}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-white p-4 text-sm leading-relaxed text-zinc-600 dark:bg-white/[0.05] dark:text-zinc-400">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">Pilot fit</p>
          <p className="mt-1">{scan.pilotFit}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <a href={demoHref} className="inline-flex h-11 items-center justify-center rounded-full bg-[#c8922a] px-6 text-sm font-semibold text-white shadow-[0_3px_14px_rgb(200,146,42,0.28)] hover:bg-[#b17f24]">
          Book a demo
        </a>
        <Link href="/company-daily-scan" className="inline-flex h-11 items-center justify-center rounded-full border border-black/[0.12] px-6 text-sm font-semibold text-zinc-700 hover:border-[#c8922a]/40 hover:text-[#c8922a] dark:border-white/[0.12] dark:text-zinc-300">
          See Company Daily Scan
        </Link>
      </div>
    </div>
  );
}

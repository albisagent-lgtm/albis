"use client";

import { PremiumGate } from "@/app/components/premium-gate";
import { PerspectiveBar } from "@/app/components/perspective-bar";
import Link from "next/link";
import Script from "next/script";
import { useState } from "react";
import type { ScanItem } from "@/lib/scan-types";

// Mock deep dive data — will be replaced with real Sonnet calls later
const MOCK_ANALYSIS = {
  headline: "Ukraine-Russia peace talks day 3: land remains core sticking point; Trump demands speed",
  category: "World",
  date: "February 18, 2026",
  dateISO: "2026-02-18",
  regions: ["eastern-europe", "western-world", "middle-east", "east-se-asia", "south-asia"],
  significance: "high" as const,

  // SCAN section — What happened (facts, multi-sourced)
  scan: {
    summary: "Day three of the Geneva peace talks between Ukraine and Russia concluded with both delegations describing progress as 'constructive' while fundamental disagreements on territorial sovereignty remain unresolved. US President Trump publicly called for an accelerated timeline, while European leaders urged a framework that prevents setting precedent for territorial seizure.",
    facts: [
      "Talks entered their third day at the Palais des Nations in Geneva",
      "47 sources across 5 regions covered the story with significant framing differences",
      "Both sides issued statements describing talks as 'constructive'",
      "Trump administration publicly pushed for resolution within weeks, not months",
      "European leaders released a joint statement emphasizing sovereignty principles",
      "Energy markets responded with a 3% dip in natural gas futures",
    ],
    sourceCount: 47,
    regionCount: 5,
    languageCount: 4,
  },

  // DETECT section — How it is being framed (regional perspectives)
  detect: [
    {
      region: "Western Media",
      regionId: "western-world",
      framing: "Emphasizes Trump's pressure for rapid resolution and frames the talks through a 'dealmaking' lens. Focus on diplomatic process and European concerns about precedent.",
      tone: "Urgency",
      toneScore: 85,
    },
    {
      region: "Russian State Media",
      regionId: "eastern-europe",
      framing: "Frames territorial gains as non-negotiable starting points. Portrays Russia as the reasonable party willing to negotiate from a position of strength.",
      tone: "Assertive",
      toneScore: 70,
    },
    {
      region: "Ukrainian Sources",
      regionId: "eastern-europe",
      framing: "Stresses sovereignty as the absolute red line. Frames any territorial concession as capitulation. Highlights civilian cost and displacement.",
      tone: "Defiant",
      toneScore: 75,
    },
    {
      region: "Middle Eastern Coverage",
      regionId: "middle-east",
      framing: "Focuses on energy market implications and broader geopolitical realignment. Less emotionally invested, more analytical about power dynamics.",
      tone: "Analytical",
      toneScore: 40,
    },
    {
      region: "Asian Coverage",
      regionId: "east-se-asia",
      framing: "Frames through the lens of precedent-setting for territorial disputes in Asia. Concerned about implications for Taiwan and South China Sea.",
      tone: "Cautious",
      toneScore: 55,
    },
  ],

  // COMPARE section — What you are not seeing (blindspots)
  compare: {
    blindspots: [
      "The specific territorial concessions being discussed behind closed doors",
      "The role of private diplomatic channels running parallel to Geneva",
      "Economic pressure from energy markets shaping both sides' timelines",
      "Civilian displacement data from contested regions",
      "The gap between public negotiating positions and private flexibility",
    ],
    coverageGaps: [
      { region: "Africa", note: "Virtually zero coverage despite significant food security implications from the conflict" },
      { region: "Latin America", note: "Minimal coverage focused only on commodity price impacts, ignoring diplomatic precedent" },
      { region: "South Asia", note: "Limited to wire service reprints with no original analysis or regional perspective" },
    ],
  },

  // REVEAL section — Pattern connections
  reveal: [
    {
      pattern: "Temporal Displacement",
      explanation: "The pressure for speed displaces the question of whether a fast deal is a good deal. Historical parallels (hasty post-conflict agreements that collapsed) are absent from mainstream coverage.",
      relatedStories: ["Munich Agreement parallels in academic discourse", "Libya post-intervention framework failures"],
    },
    {
      pattern: "Sovereignty Theatre",
      explanation: "Both sides perform sovereignty claims publicly while the actual negotiations operate on different logic — resource access, security guarantees, and sphere-of-influence recognition.",
      relatedStories: ["South China Sea territorial claims", "Kashmir sovereignty debates"],
    },
    {
      pattern: "Information Asymmetry",
      explanation: "Negotiators have access to intelligence and economic data that fundamentally shapes their positions, but public discourse operates without this context.",
      relatedStories: ["Iran nuclear deal information gaps", "Trade negotiation opacity patterns"],
    },
  ],
};

const SECTIONS = ["scan", "detect", "compare", "reveal"] as const;
type Section = typeof SECTIONS[number];

const SECTION_META: Record<Section, { label: string; sublabel: string; color: string; darkColor: string }> = {
  scan: { label: "SCAN", sublabel: "What happened", color: "text-blue-600", darkColor: "dark:text-blue-400" },
  detect: { label: "DETECT", sublabel: "How it is being framed", color: "text-violet-600", darkColor: "dark:text-violet-400" },
  compare: { label: "COMPARE", sublabel: "What you are not seeing", color: "text-amber-600", darkColor: "dark:text-amber-400" },
  reveal: { label: "REVEAL", sublabel: "Pattern connections", color: "text-emerald-600", darkColor: "dark:text-emerald-400" },
};

function getJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: MOCK_ANALYSIS.headline,
    datePublished: MOCK_ANALYSIS.dateISO,
    dateModified: MOCK_ANALYSIS.dateISO,
    author: { "@type": "Organization", name: "Albis", url: "https://albis.news" },
    publisher: { "@type": "Organization", name: "Albis", url: "https://albis.news" },
    description: `AI-powered deep dive analysis of: ${MOCK_ANALYSIS.headline}. Covering ${MOCK_ANALYSIS.scan.sourceCount} sources across ${MOCK_ANALYSIS.scan.regionCount} regions.`,
    mainEntityOfPage: { "@type": "WebPage" },
    articleSection: MOCK_ANALYSIS.category,
  };
}

export default function DeepDivePage() {
  return (
    <PremiumGate>
      <Script
        id="deep-dive-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getJsonLd()) }}
      />
      <DeepDiveContent />
    </PremiumGate>
  );
}

function DeepDiveContent() {
  const d = MOCK_ANALYSIS;
  const [activeSection, setActiveSection] = useState<Section>("scan");

  // Create a mock ScanItem for the PerspectiveBar
  const mockItem: ScanItem = {
    headline: d.headline,
    category: d.category,
    regions: d.regions,
    tags: [],
    patterns: [],
    significance: d.significance,
    connection: "",
  };

  return (
    <main>
      {/* Header */}
      <section className="border-b border-zinc-200 py-12 dark:border-zinc-800/50 md:py-16">
        <div className="mx-auto max-w-3xl px-6">
          {/* AI badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 dark:border-violet-800/50 dark:bg-violet-950/30 dark:text-violet-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            Generated by AI analysis
          </div>

          <h1 className="mt-6 font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-snug leading-headline tracking-tight text-zinc-800 dark:text-zinc-100 md:text-3xl">
            {d.headline}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <time className="text-zinc-400 dark:text-zinc-500">{d.date}</time>
            <span className="text-zinc-300 dark:text-zinc-700">&middot;</span>
            <span className="text-zinc-400 dark:text-zinc-500">{d.category}</span>
            <span className="text-zinc-300 dark:text-zinc-700">&middot;</span>
            <span className="text-zinc-400 dark:text-zinc-500">
              {d.scan.sourceCount} sources across {d.scan.regionCount} regions
            </span>
          </div>

          {/* Perspective bar */}
          <div className="mt-4">
            <PerspectiveBar item={mockItem} />
          </div>

          {/* Section navigation pills */}
          <div className="mt-8 flex flex-wrap gap-2">
            {SECTIONS.map((section) => {
              const meta = SECTION_META[section];
              const isActive = activeSection === section;
              return (
                <button
                  key={section}
                  onClick={() => {
                    setActiveSection(section);
                    document.getElementById(`section-${section}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#1a3a5c] text-white shadow-sm dark:bg-[#1a3a5c]"
                      : "border border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600"
                  }`}
                >
                  <span className="font-bold tracking-wider">{meta.label}</span>
                  <span className={isActive ? "text-white/60" : "text-zinc-400 dark:text-zinc-500"}>{meta.sublabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SCAN — What happened ─────────────────────────────── */}
      <section id="section-scan" className="border-b border-zinc-200 py-12 dark:border-zinc-800/50">
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-600 dark:text-blue-400">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                SCAN
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">What happened</p>
            </div>
          </div>

          <p className="mt-6 text-base leading-relaxed text-zinc-600 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
            {d.scan.summary}
          </p>

          <ul className="mt-6 space-y-3">
            {d.scan.facts.map((fact, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-zinc-600 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
                <span className="mt-2 block h-1 w-1 flex-shrink-0 rounded-full bg-blue-400 dark:bg-blue-500" />
                <span>{fact}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex gap-6 text-xs text-zinc-400 dark:text-zinc-500">
            <span>{d.scan.sourceCount} sources</span>
            <span>{d.scan.regionCount} regions</span>
            <span>{d.scan.languageCount} languages</span>
          </div>
        </div>
      </section>

      {/* ── DETECT — How it is being framed ──────────────────── */}
      <section id="section-detect" className="border-b border-zinc-200 py-12 dark:border-zinc-800/50">
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/30">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-600 dark:text-violet-400">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
                DETECT
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">How it is being framed</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {d.detect.map((perspective, i) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {perspective.region}
                  </span>
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:bg-violet-950/30 dark:text-violet-400">
                    {perspective.tone}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
                  {perspective.framing}
                </p>
                {/* Tone bar */}
                <div className="mt-3">
                  <div className="h-1 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-1 rounded-full bg-violet-400 transition-all"
                      style={{ width: `${perspective.toneScore}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                    Emotional intensity: {perspective.toneScore}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARE — What you are not seeing ────────────────── */}
      <section id="section-compare" className="border-b border-zinc-200 py-12 dark:border-zinc-800/50 bg-amber-50/30 dark:bg-amber-950/5">
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/30">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-amber-600 dark:text-amber-400">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                COMPARE
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">What you are not seeing</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-amber-200/50 bg-white p-6 dark:border-amber-800/20 dark:bg-amber-950/10">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-700 dark:text-amber-400">
              Blindspots detected
            </p>
            <ul className="mt-4 space-y-3">
              {d.compare.blindspots.map((point, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-zinc-600 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
                  <span className="mt-2 block h-1 w-1 flex-shrink-0 rounded-full bg-amber-400 dark:bg-amber-500" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-700 dark:text-amber-400">
              Coverage gaps by region
            </p>
            <div className="mt-4 space-y-3">
              {d.compare.coverageGaps.map((gap, i) => (
                <div key={i} className="rounded-lg border border-amber-200/30 bg-white/50 p-4 dark:border-amber-800/15 dark:bg-amber-950/5">
                  <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                    {gap.region}
                  </span>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {gap.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── REVEAL — Pattern connections ──────────────────────── */}
      <section id="section-reveal" className="border-b border-zinc-200 py-12 dark:border-zinc-800/50">
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-600 dark:text-emerald-400">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                REVEAL
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Pattern connections</p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {d.reveal.map((p, i) => (
              <div key={i} className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800/50">
                <span className="inline-flex rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                  {p.pattern}
                </span>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
                  {p.explanation}
                </p>
                {/* Related stories — connected dots */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.relatedStories.map((story, j) => (
                    <span
                      key={j}
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/50 bg-emerald-50/50 px-3 py-1 text-[10px] text-emerald-700 dark:border-emerald-800/30 dark:bg-emerald-950/20 dark:text-emerald-400"
                    >
                      <span className="h-1 w-1 rounded-full bg-emerald-400" />
                      {story}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer + Nav */}
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-500 dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:text-zinc-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            AI-generated analysis. Sources cross-referenced but interpretation is algorithmic.
          </div>

          <div className="mt-8">
            <Link
              href="/briefing"
              className="text-sm text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300 min-h-[44px] inline-flex items-center"
            >
              Back to briefing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology — How Albis Measures Perception Gaps | Albis",
  description:
    "The full methodology behind the Perception Gap Index (PGI) and Global Attention Index (GAI) — how Albis scans, scores, and measures how differently the world reports the same events.",
};

const tributaries = [
  { code: "PGI-GP", name: "Geopolitics", weight: 35 },
  { code: "PGI-IW", name: "Information Warfare", weight: 20 },
  { code: "PGI-EC", name: "Economics", weight: 15 },
  { code: "PGI-TE", name: "Technology", weight: 10 },
  { code: "PGI-WR", name: "Women\u2019s Rights", weight: 10 },
  { code: "PGI-HE", name: "Health", weight: 5 },
  { code: "PGI-CL", name: "Climate", weight: 5 },
];

const regions = [
  { name: "US", pop: "0.37B" },
  { name: "Asia-Pacific", pop: "1.55B" },
  { name: "EU", pop: "0.45B" },
  { name: "Middle East", pop: "0.25B" },
  { name: "South Asia", pop: "1.9B" },
  { name: "Africa", pop: "1.4B" },
  { name: "Latin America", pop: "0.65B" },
];

export default function MethodologyPage() {
  return (
    <main className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-2xl px-space-6 py-space-16 md:py-space-24">
        {/* Hero */}
        <p className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400">
          Methodology
        </p>

        <div className="mt-space-12 space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold leading-tight tracking-tight text-[#0f0f0f] dark:text-[#f0efec] md:text-4xl">
            How Albis Measures the World
          </h1>
          <p className="text-xl text-zinc-500 dark:text-zinc-400">
            The methodology behind the Perception Gap Index and Global Attention
            Index — fully transparent, fully open.
          </p>
        </div>

        {/* The Problem We Are Solving */}
        <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
            The Problem We Are Solving
          </h2>
          <div className="space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            <p>
              The same event gets reported differently depending on where you
              are. A person in London, Tehran, and Beijing reading about the same
              war are reading three completely different realities. All from real
              outlets. All sourced and cited. All think they are informed.
            </p>
            <p>
              The gap between those realities is what Albis measures. Not to say
              who is right, but to make the differences visible — so you can see
              what you&apos;re not being shown.
            </p>
          </div>
        </div>

        {/* Perception Gap Index */}
        <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
            The Perception Gap Index (PGI)
          </h2>
          <p className="mb-space-4 text-sm text-zinc-500 dark:text-zinc-400">
            <a href="/indexes/pgi" className="text-[#c8922a] hover:underline dark:text-[#c8922a]">
              What is the PGI? Full explainer →
            </a>
          </p>
          <div className="space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            <p>
              The PGI measures{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">
                narrative distance
              </strong>{" "}
              between regions on the same story. It runs on a 1–10 scale.
            </p>
          </div>

          {/* Scale explanation */}
          <div className="mt-space-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-black/[0.05] p-4 dark:border-white/[0.05]">
              <span className="font-[family-name:var(--font-source-serif)] text-2xl font-semibold text-[#c8922a]">
                1
              </span>
              <p className="mt-1 font-[family-name:var(--font-source-serif)] text-sm text-zinc-600 dark:text-zinc-400">
                Global consensus — the same framing everywhere. Everyone
                essentially agrees on what happened and what it means.
              </p>
            </div>
            <div className="rounded-lg border border-black/[0.05] p-4 dark:border-white/[0.05]">
              <span className="font-[family-name:var(--font-source-serif)] text-2xl font-semibold text-[#c8922a]">
                10
              </span>
              <p className="mt-1 font-[family-name:var(--font-source-serif)] text-sm text-zinc-600 dark:text-zinc-400">
                Completely opposed narratives — the same event described as
                opposite things. One side&apos;s liberation is another
                side&apos;s invasion.
              </p>
            </div>
          </div>

          {/* Tributaries */}
          <div className="mt-space-8">
            <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-4">
              The 7 Tributaries
            </h3>
            <div className="space-y-2">
              {tributaries.map((t) => (
                <div key={t.code} className="flex items-center gap-3">
                  <div className="w-full rounded-md bg-zinc-100 dark:bg-zinc-800/50 overflow-hidden">
                    <div
                      className="h-8 rounded-md bg-[#c8922a]/20 dark:bg-[#c8922a]/15 flex items-center px-3"
                      style={{ width: `${Math.max(t.weight * 2.5, 20)}%` }}
                    >
                      <span className="font-[family-name:var(--font-source-serif)] text-sm font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                        {t.code}{" "}
                        <span className="text-zinc-500 dark:text-zinc-400 font-normal">
                          {t.name}
                        </span>
                      </span>
                    </div>
                  </div>
                  <span className="font-[family-name:var(--font-source-serif)] text-sm font-semibold text-[#c8922a] w-10 text-right shrink-0">
                    {t.weight}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Scoring dimensions */}
          <div className="mt-space-8">
            <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-4">
              How We Score
            </h3>
            <p className="font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 mb-space-4">
              Every story is evaluated across 6 dimensions:
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                "Source framing",
                "Emotional tone",
                "Causal attribution",
                "Actor portrayal",
                "Solution framing",
                "Omission patterns",
              ].map((dim) => (
                <div
                  key={dim}
                  className="rounded-lg border border-black/[0.05] px-3 py-2 dark:border-white/[0.05]"
                >
                  <span className="font-[family-name:var(--font-source-serif)] text-sm text-zinc-700 dark:text-zinc-300">
                    {dim}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* PGI Example */}
          <div className="mt-space-8 rounded-lg border border-[#c8922a]/20 bg-[#c8922a]/[0.03] p-5 dark:border-[#c8922a]/15 dark:bg-[#c8922a]/[0.02]">
            <p className="font-[family-name:var(--font-source-serif)] text-sm font-semibold text-[#c8922a] uppercase tracking-wide mb-2">
              Example — PGI 8–9
            </p>
            <p className="font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
              The Iran war scores 8–9. Western outlets frame precision strikes
              and military objectives. Middle Eastern outlets frame civilian
              casualties and humanitarian crisis. Chinese outlets frame US
              imperial decline and multipolarity. Same events — three
              fundamentally different realities.
            </p>
          </div>
        </div>

        {/* Global Attention Index */}
        <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
            The Global Attention Index (GAI)
          </h2>
          <p className="mb-space-4 text-sm text-zinc-500 dark:text-zinc-400">
            <a href="/indexes/gai" className="text-[#c8922a] hover:underline dark:text-[#c8922a]">
              What is the GAI? Full explainer →
            </a>
          </p>
          <div className="space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            <p>
              The GAI measures whether stories are covered{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">
                at all
              </strong>{" "}
              across regions. It runs on a 1–10 scale.
            </p>
          </div>

          {/* Scale explanation */}
          <div className="mt-space-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-black/[0.05] p-4 dark:border-white/[0.05]">
              <span className="font-[family-name:var(--font-source-serif)] text-2xl font-semibold text-[#c8922a]">
                1
              </span>
              <p className="mt-1 font-[family-name:var(--font-source-serif)] text-sm text-zinc-600 dark:text-zinc-400">
                Story covered everywhere — every region is reporting on it.
                Global awareness is high.
              </p>
            </div>
            <div className="rounded-lg border border-black/[0.05] p-4 dark:border-white/[0.05]">
              <span className="font-[family-name:var(--font-source-serif)] text-2xl font-semibold text-[#c8922a]">
                10
              </span>
              <p className="mt-1 font-[family-name:var(--font-source-serif)] text-sm text-zinc-600 dark:text-zinc-400">
                Story exists in one region only — invisible to the rest of the
                world. A blind spot hiding in plain sight.
              </p>
            </div>
          </div>

          <div className="mt-space-6 space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            <p>
              Why this matters: the stories nobody is covering are often the most
              important. A crisis that affects 200 million people but gets zero
              Western coverage is not a minor story — it&apos;s a major failure
              of global information systems.
            </p>
            <p>
              The GAI uses the same 7 tributary structure as the PGI, weighted
              by regional population to reflect how many people are actually
              reached.
            </p>
          </div>

          {/* Regional population weighting */}
          <div className="mt-space-6">
            <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-4">
              Regional Population Weighting
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {regions.map((r) => (
                <div
                  key={r.name}
                  className="rounded-lg border border-black/[0.05] px-3 py-2 dark:border-white/[0.05]"
                >
                  <span className="font-[family-name:var(--font-source-serif)] text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {r.name}
                  </span>
                  <br />
                  <span className="font-[family-name:var(--font-source-serif)] text-xs text-zinc-500 dark:text-zinc-400">
                    {r.pop}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 font-[family-name:var(--font-source-serif)] text-sm text-zinc-400 dark:text-zinc-500">
              Total coverage: 6.24 billion people
            </p>
          </div>

          {/* GAI Example */}
          <div className="mt-space-8 rounded-lg border border-[#c8922a]/20 bg-[#c8922a]/[0.03] p-5 dark:border-[#c8922a]/15 dark:bg-[#c8922a]/[0.02]">
            <p className="font-[family-name:var(--font-source-serif)] text-sm font-semibold text-[#c8922a] uppercase tracking-wide mb-2">
              Example — GAI 7.4
            </p>
            <p className="font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
              Nepal election — a major story in South Asia affecting millions of
              people. Virtually invisible in Western media. GAI 7.4. If you only
              read English-language news, this event did not happen.
            </p>
          </div>
        </div>

        {/* Our Scanning Process */}
        <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
            Our Scanning Process
          </h2>
          <div className="space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            <p>
              We scan the world{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">
                3 times daily
              </strong>{" "}
              — at 7am, 1pm, and 7pm NZST.
            </p>
          </div>

          <div className="mt-space-6 space-y-3">
            {[
              ["7 regions", "~60 countries covered per scan"],
              ["19 categories", "~88 English searches per scan"],
              ["9 native languages", "Arabic, Farsi, Mandarin, Russian, Hindi, Spanish, French, Turkish, Portuguese"],
              ["~178 total searches", "per scan cycle across all languages"],
            ].map(([label, desc]) => (
              <div key={label} className="flex gap-4">
                <span className="font-[family-name:var(--font-source-serif)] text-sm font-semibold text-[#c8922a] whitespace-nowrap w-40 shrink-0">
                  {label}
                </span>
                <span className="font-[family-name:var(--font-source-serif)] text-sm text-zinc-600 dark:text-zinc-400">
                  {desc}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-space-6 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            <p>
              Why native languages matter: domestic media tells its own
              population a different story. We read what Iranians read, not just
              what Reuters says about Iran. We read what Chinese citizens read,
              not just what the BBC says about China. The domestic narrative is
              where the real framing lives.
            </p>
          </div>
        </div>

        {/* Our Commitment to Transparency */}
        <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
            Our Commitment to Transparency
          </h2>
          <div className="space-y-space-3 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            {[
              "We do not pick sides.",
              "We measure gaps, not judge them.",
              "All scoring is documented and consistent.",
              "We flag when our own methodology has limitations.",
              "Sources are listed in every article.",
              "We never fabricate quotes or data.",
            ].map((point) => (
              <div key={point} className="flex gap-3">
                <span className="text-[#c8922a] mt-1 shrink-0">—</span>
                <p>{point}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Limitations */}
        <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
            Limitations
          </h2>
          <p className="mb-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            No methodology is perfect. Here is where ours has edges:
          </p>
          <div className="space-y-space-3 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            {[
              "We are an AI-assisted platform — human editorial oversight is applied to every published piece.",
              "Our regional coverage is broad but not exhaustive. Some countries and languages are underrepresented.",
              "PGI scores are estimates based on available sources, not definitive measurements.",
              "Language models can have biases — we actively work to identify and correct these.",
              "We are a small team building in public — errors happen and we correct them openly.",
            ].map((point) => (
              <div key={point} className="flex gap-3">
                <span className="text-zinc-400 mt-1 shrink-0">—</span>
                <p>{point}</p>
              </div>
            ))}
          </div>
        </div>

        {/* A Note on Independence */}
        <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
            A Note on Independence
          </h2>
          <p className="font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            Albis has no political affiliation, receives no government funding,
            and takes no editorial direction from any organisation. The goal is
            clarity, not influence. We exist to help people see more, not to tell
            them what to think.
          </p>
        </div>
      </div>
    </main>
  );
}

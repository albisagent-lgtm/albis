"use client";

import Link from "next/link";
import { ShareButtons, EmbedCode } from "../../components/share-buttons";
import { useState } from "react";

function getTierColor(pgi: number) {
  if (pgi <= 2.0) return "#22c55e";
  if (pgi <= 4.0) return "#f59e0b";
  if (pgi <= 6.0) return "#f97316";
  if (pgi <= 8.0) return "#ef4444";
  return "#71717a";
}

interface PgiShareBarProps {
  latestDate?: string;
  latestPgi?: number;
  dates: Array<{ date: string; pgi: number }>;
}

export function PgiShareBar({ latestDate, latestPgi, dates }: PgiShareBarProps) {
  const [showEmbed, setShowEmbed] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const shareUrl = "https://www.albis.news/indexes/pgi";
  const shareTitle = latestPgi
    ? `PGI ${latestPgi.toFixed(1)} — How differently does the world see today's stories?`
    : "Perception Gap Index — Albis";

  return (
    <div className="mx-auto max-w-6xl px-6 pt-6">
      {/* Share + actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <ShareButtons url={shareUrl} title={shareTitle} compact />

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEmbed(!showEmbed)}
            className="text-xs font-medium text-zinc-500 hover:text-[#c8922a] transition-colors dark:text-zinc-400"
          >
            {showEmbed ? "Hide embed" : "Embed widget"}
          </button>
          <button
            onClick={() => setShowArchive(!showArchive)}
            className="text-xs font-medium text-zinc-500 hover:text-[#c8922a] transition-colors dark:text-zinc-400"
          >
            {showArchive ? "Hide archive" : "Daily archive"}
          </button>
          {latestDate && (
            <Link
              href={`/pgi/${latestDate}`}
              className="text-xs font-medium text-[#c8922a] hover:text-[#c8922a]/80 transition-colors"
            >
              Today&apos;s report →
            </Link>
          )}
        </div>
      </div>

      {/* Embed code (toggled) */}
      {showEmbed && (
        <div className="mb-4">
          <EmbedCode src="https://www.albis.news/embed/pgi" width={400} height={180} />
        </div>
      )}

      {/* Archive (toggled) */}
      {showArchive && dates.length > 0 && (
        <div className="mb-4 rounded-xl border border-black/[0.06] p-4 dark:border-white/[0.06]">
          <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-[#c8922a] mb-3">
            Daily PGI Reports
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {dates.map((d) => {
              const dateObj = new Date(d.date + "T00:00:00");
              const label = dateObj.toLocaleDateString("en-NZ", { month: "short", day: "numeric" });
              return (
                <Link
                  key={d.date}
                  href={`/pgi/${d.date}`}
                  className="flex items-center justify-between rounded-lg border border-black/[0.04] px-3 py-2 text-xs hover:border-[#c8922a]/30 transition-colors dark:border-white/[0.04]"
                >
                  <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
                  <span className="font-semibold" style={{ color: getTierColor(d.pgi) }}>
                    {d.pgi.toFixed(1)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

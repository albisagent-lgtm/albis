"use client";

import { useEffect, useState } from "react";

interface PulseData {
  id: number;
  updated_at: string;
  scan_period: string | null;
  global_mood: string | null;
  top_pgi_story: string | null;
  top_pgi_score: number | null;
  top_gai_story: string | null;
  top_gai_score: number | null;
  stories_found: number;
}

function getMoodColor(mood: string | null): string {
  if (!mood) return "bg-zinc-400";
  const lower = mood.toLowerCase();
  if (lower.includes("volatile") || lower.includes("critical")) return "bg-red-500";
  if (lower.includes("tense") || lower.includes("elevated")) return "bg-amber-500";
  if (lower.includes("calm") || lower.includes("stable")) return "bg-emerald-500";
  return "bg-amber-500";
}

function getRelativeTime(updatedAt: string): string {
  const now = new Date();
  const updated = new Date(updatedAt);
  const diffMs = now.getTime() - updated.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Updated just now";
  if (diffMin < 60) return `Updated ${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Updated ${diffHr}h ago`;
  return `Updated ${Math.floor(diffHr / 24)}d ago`;
}

export function ScanPulse() {
  const [pulse, setPulse] = useState<PulseData | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchPulse() {
      try {
        const res = await fetch("/api/scan/pulse", { cache: "no-store" });
        const data = await res.json();
        if (mounted && data.pulse) {
          setPulse(data.pulse);
        }
      } catch {
        // Silently fail
      }
    }

    fetchPulse();
    const interval = setInterval(fetchPulse, 60000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!pulse) {
    return (
      <div className="border-b border-black/5 bg-[#f8f7f4] dark:border-white/5 dark:bg-[#0a0a0a]">
        <div className="mx-auto max-w-5xl px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-zinc-400" />
            </span>
            <span className="font-semibold tracking-wider uppercase">Live</span>
            <span className="mx-1 text-black/10 dark:text-white/10">|</span>
            <span>Scanning...</span>
          </div>
        </div>
      </div>
    );
  }

  const moodColor = getMoodColor(pulse.global_mood);

  return (
    <div className="border-b border-black/5 bg-[#f8f7f4] dark:border-white/5 dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-5xl px-4 py-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {/* Pulsing dot + LIVE */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${moodColor} opacity-75`} />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${moodColor}`} />
            </span>
            <span className="font-semibold tracking-wider uppercase text-zinc-600 dark:text-zinc-300">
              Live
            </span>
          </div>

          <span className="hidden sm:inline text-black/10 dark:text-white/10">|</span>

          {/* Global mood */}
          <span className="font-medium text-zinc-600 dark:text-zinc-300">
            {pulse.global_mood || "—"}
          </span>

          {/* Top PGI story */}
          {pulse.top_pgi_story && (
            <>
              <span className="hidden sm:inline text-black/10 dark:text-white/10">|</span>
              <span className="text-zinc-400 dark:text-zinc-500">
                <span className="font-semibold text-zinc-500 dark:text-zinc-400">PGI High:</span>{" "}
                {pulse.top_pgi_story}
                {pulse.top_pgi_score !== null && (
                  <span className="ml-1 text-red-500 font-medium">
                    {Number(pulse.top_pgi_score).toFixed(1)}
                  </span>
                )}
              </span>
            </>
          )}

          {/* Top GAI story */}
          {pulse.top_gai_story && (
            <>
              <span className="hidden sm:inline text-black/10 dark:text-white/10">|</span>
              <span className="text-zinc-400 dark:text-zinc-500">
                <span className="font-semibold text-zinc-500 dark:text-zinc-400">Invisible:</span>{" "}
                {pulse.top_gai_story}
              </span>
            </>
          )}

          {/* Updated time — pushed to the right on larger screens */}
          <span className="ml-auto text-zinc-400 dark:text-zinc-600">
            {getRelativeTime(pulse.updated_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

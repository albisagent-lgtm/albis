"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

export interface QuadrantStory {
  headline: string;
  slug: string;
  pgi: number;
  gai: number;
  category?: string;
}

interface PgiGaiQuadrantProps {
  stories: QuadrantStory[];
  date?: string;
}

function getPgiColor(pgi: number): string {
  if (pgi <= 2.0) return "#10b981"; // emerald
  if (pgi <= 4.0) return "#f59e0b"; // amber
  if (pgi <= 6.0) return "#f97316"; // orange
  if (pgi <= 8.0) return "#ef4444"; // red
  return "#71717a"; // zinc
}

export function PgiGaiQuadrant({ stories, date }: PgiGaiQuadrantProps) {
  const [activeStory, setActiveStory] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Take top 15 stories
  const plotted = stories.slice(0, 15);

  const handleDotInteraction = useCallback(
    (index: number, e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const rect = (e.currentTarget as HTMLElement).closest(".quadrant-container")?.getBoundingClientRect();
      if (!rect) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      setTooltipPos({
        x: clientX - rect.left,
        y: clientY - rect.top,
      });
      setActiveStory(activeStory === index ? null : index);
    },
    [activeStory]
  );

  if (plotted.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Quadrant grid */}
      <div
        className="quadrant-container relative mx-auto aspect-square w-full max-w-[300px] md:max-w-[400px]"
        onMouseLeave={() => setActiveStory(null)}
      >
        {/* Background quadrant shading */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 rounded-lg overflow-hidden">
          {/* Top-left: Hidden Consensus — blue/zinc tint */}
          <div className="bg-blue-500/[0.04] dark:bg-blue-400/[0.03]" />
          {/* Top-right: Danger Zone — red tint */}
          <div className="bg-red-500/[0.05] dark:bg-red-400/[0.04]" />
          {/* Bottom-left: Global Consensus — emerald tint */}
          <div className="bg-emerald-500/[0.04] dark:bg-emerald-400/[0.03]" />
          {/* Bottom-right: Contested Reality — amber tint */}
          <div className="bg-amber-500/[0.04] dark:bg-amber-400/[0.03]" />
        </div>

        {/* Grid lines */}
        <div className="absolute inset-0 rounded-lg border border-zinc-200 dark:border-zinc-700">
          {/* Vertical centre line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-700" />
          {/* Horizontal centre line */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-zinc-200 dark:bg-zinc-700" />
        </div>

        {/* Quadrant labels */}
        <span className="absolute top-2 left-2 text-[9px] md:text-[10px] leading-tight text-zinc-300 dark:text-zinc-600 select-none">
          Hidden<br />Consensus
        </span>
        <span className="absolute top-2 right-2 text-[9px] md:text-[10px] leading-tight text-right text-zinc-300 dark:text-zinc-600 select-none">
          Danger<br />Zone
        </span>
        <span className="absolute bottom-2 left-2 text-[9px] md:text-[10px] leading-tight text-zinc-300 dark:text-zinc-600 select-none">
          Global<br />Consensus
        </span>
        <span className="absolute bottom-2 right-2 text-[9px] md:text-[10px] leading-tight text-right text-zinc-300 dark:text-zinc-600 select-none">
          Contested<br />Reality
        </span>

        {/* Y-axis label */}
        <span className="absolute -left-6 md:-left-7 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] md:text-xs font-medium text-zinc-400 dark:text-zinc-500 whitespace-nowrap select-none tracking-wide">
          Attention Gap
        </span>

        {/* Story dots */}
        {plotted.map((story, i) => {
          // Map PGI 1-10 to 5%-95% horizontal
          const xPercent = 5 + ((story.pgi - 1) / 9) * 90;
          // Map GAI 1-10 to 95%-5% vertical (high GAI = top)
          const yPercent = 95 - ((story.gai - 1) / 9) * 90;

          return (
            <button
              key={i}
              className="absolute h-2 w-2 rounded-full transition-all duration-150 hover:scale-[1.8] focus:scale-[1.8] focus:outline-none"
              style={{
                left: `${xPercent}%`,
                top: `${yPercent}%`,
                transform: "translate(-50%, -50%)",
                backgroundColor: getPgiColor(story.pgi),
                boxShadow:
                  activeStory === i
                    ? `0 0 0 3px ${getPgiColor(story.pgi)}40`
                    : "none",
                zIndex: activeStory === i ? 20 : 10,
              }}
              onMouseEnter={(e) => handleDotInteraction(i, e)}
              onTouchStart={(e) => handleDotInteraction(i, e)}
              aria-label={`${story.headline} — PGI ${story.pgi.toFixed(1)}, GAI ${story.gai.toFixed(1)}`}
            />
          );
        })}

        {/* Tooltip */}
        {activeStory !== null && plotted[activeStory] && (
          <div
            className="pointer-events-none absolute z-30 max-w-[200px] rounded-lg border border-black/[0.08] bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm dark:border-white/[0.1] dark:bg-zinc-900/95"
            style={{
              left: `${Math.min(Math.max(tooltipPos.x, 60), 240)}px`,
              top: `${Math.max(tooltipPos.y - 60, 8)}px`,
            }}
          >
            <p className="text-xs font-medium leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
              {plotted[activeStory].headline}
            </p>
            <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
              PGI {plotted[activeStory].pgi.toFixed(1)} · GAI{" "}
              {plotted[activeStory].gai.toFixed(1)}
            </p>
          </div>
        )}
      </div>

      {/* X-axis label */}
      <p className="text-center text-[10px] md:text-xs font-medium text-zinc-400 dark:text-zinc-500 tracking-wide select-none">
        Perception Gap →
      </p>

      {/* Explanation */}
      <p className="text-center text-[10px] md:text-xs leading-relaxed text-zinc-400 dark:text-zinc-500 max-w-sm mx-auto">
        Each dot is a story. Position shows how fragmented (→) and how
        invisible (↑) it is across global media.
      </p>

      {date && (
        <p className="text-center text-[10px] text-zinc-300 dark:text-zinc-600">
          {date}
        </p>
      )}
    </div>
  );
}

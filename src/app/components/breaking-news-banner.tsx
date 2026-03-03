"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface BannerItem {
  id: string;
  headline: string;
  url: string | null;
  mode: "breaking" | "top-story";
}

export function BreakingNewsBanner() {
  const [item, setItem] = useState<BannerItem | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchBanner() {
      try {
        // Fetch breaking news first
        const breakingRes = await fetch("/api/breaking", { cache: "no-store" });
        const breakingData = await breakingRes.json();
        
        // Check if breaking news is recent (< 6 hours)
        if (breakingData.breaking) {
          const createdAt = new Date(breakingData.breaking.created_at);
          const now = new Date();
          const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff < 6) {
            if (mounted) {
              setItem({
                id: breakingData.breaking.id,
                headline: breakingData.breaking.headline,
                url: breakingData.breaking.url,
                mode: "breaking",
              });
            }
            return;
          }
        }
        
        // Fallback to top story
        const topStoryRes = await fetch("/api/top-story", { cache: "no-store" });
        const topStoryData = await topStoryRes.json();
        
        if (mounted && topStoryData.topStory) {
          setItem({
            id: `top-story-${topStoryData.topStory.scan_date}`,
            headline: topStoryData.topStory.headline,
            url: topStoryData.topStory.url,
            mode: "top-story",
          });
        } else if (mounted) {
          setItem(null);
        }
      } catch {
        // Silently fail
      }
    }

    fetchBanner();
    const interval = setInterval(fetchBanner, 60000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!item || dismissed) return null;

  const isBreaking = item.mode === "breaking";

  const content = (
    <div className="flex items-center justify-center gap-3 px-4 py-2.5 text-sm">
      {isBreaking && (
        <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
      )}
      <span className={`font-semibold tracking-wider uppercase text-xs ${
        isBreaking ? "text-red-400" : "text-[#c8922a]"
      }`}>
        {isBreaking ? "Breaking" : "Top Story"}
      </span>
      <span className="mx-1 hidden sm:inline text-white/20">|</span>
      <span className="font-[family-name:var(--font-source-serif)] text-white/95 font-medium leading-snug line-clamp-1">
        {item.headline}
      </span>
      {item.url && (
        <span className="ml-1 flex-shrink-0 text-xs text-[#c8922a] hover:text-[#d4a23a] font-medium whitespace-nowrap">
          Read more &rarr;
        </span>
      )}
    </div>
  );

  return (
    <div className={`relative border-b z-[60] ${
      isBreaking 
        ? "bg-[#1a1a1a] border-red-900/30" 
        : "bg-[#1a3a5c] border-[#c8922a]/20"
    }`}>
      {item.url ? (
        <Link href={item.url} className="block hover:opacity-90">
          {content}
        </Link>
      ) : (
        content
      )}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-lg leading-none"
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  );
}
